# AWS Deployment

This document describes the AWS infrastructure used to deploy PeerPrep, why each service was chosen, and how the network is structured.

---

## AWS Services Used

### Amazon ECR (Elastic Container Registry)
One private repository per service (`peerprep/<service-name>`). Stores the Docker images built by GitHub Actions. Used instead of Docker Hub because it lives inside AWS — ECS can pull images without leaving the network, and it integrates with IAM so no registry credentials are needed.

### Amazon ECS Fargate (Elastic Container Service)
Runs all 7 application containers. Fargate is the serverless mode of ECS — no EC2 instances to manage or patch. Each service runs as an ECS Service (which keeps a desired number of tasks alive and replaces failed ones automatically) backed by a Task Definition (which specifies the image, CPU, memory, ports, and environment variables).

### Application Load Balancer (ALB)
The single entry point for all external traffic. Responsibilities:
- **HTTP → HTTPS redirect**: all port 80 traffic is redirected to port 443 with a 301. No unencrypted traffic reaches any backend service.
- **TLS termination**: the ACM certificate is attached here. Browsers connect over `wss://` or `https://`; the ALB decrypts and forwards plain traffic inside the VPC.
- **Path-based routing**: routes requests to the correct ECS service based on URL path (e.g. `/api/users/*` → user-service).
- **Host-based routing**: `collab.peerprep-g11.online` is routed to the collaboration service, separating WebSocket traffic cleanly from the rest.
- **Health checking**: each target group periodically pings its service. Unhealthy tasks are removed from rotation automatically.

### AWS Certificate Manager (ACM)
Issues and auto-renews the TLS certificate for `peerprep-g11.online` and `*.peerprep-g11.online`. Free. DNS validation is used — a CNAME record in Route 53 proves domain ownership, and ACM validates automatically without manual steps.

### Amazon Route 53
Authoritative DNS for `peerprep-g11.online`. GoDaddy is the domain registrar but its nameservers were replaced with the Route 53 nameservers, handing DNS control to AWS. Route 53 is used because it supports **ALIAS records** on the apex domain (`peerprep-g11.online`), which standard CNAME records cannot do. ALIAS records point the bare domain to the ALB's DNS name, and Route 53 resolves the ALB IPs automatically as they change.

Records:
| Name | Type | Target |
|---|---|---|
| `peerprep-g11.online` | ALIAS | ALB |
| `www.peerprep-g11.online` | ALIAS | ALB |
| `collab.peerprep-g11.online` | ALIAS | ALB |

### Amazon ElastiCache (Redis)
Replaces the Redis container from Docker Compose. Used by the question service (caching) and matching service (session state). Runs in the private subnet — only ECS tasks can reach it, not the internet.

### AWS Secrets Manager
Stores all sensitive environment variables (MongoDB URIs, JWT secret, AI API key). ECS injects them into containers at startup as environment variables. This means no secrets are stored in the codebase, Docker images, or task definitions in plaintext.

Secrets stored:
| Secret name | Used by |
|---|---|
| `peerprep-shared-JWT_SECRET` | user-service, question-service, collaboration-service |
| `peerprep-user-service-MONGODB_URI` | user-service |
| `peerprep-question-service-MONGODB_URI` | question-service |
| `peerprep-collaboration-service-MONGODB_URI` | collaboration-service |
| `peerprep-ai-assistant-service-MONGODB_URI` | ai-assistant-service |
| `peerprep-ai-assistant-service-AI_GATEWAY_API_KEY` | ai-assistant-service |

### AWS IAM (Identity and Access Management)
Three roles are used:

| Role | Purpose |
|---|---|
| `peerprep-ecs-execution-role` | Used by ECS infrastructure to pull images from ECR, write logs to CloudWatch, and fetch secrets from Secrets Manager at container startup. |
| `peerprep-ecs-task-role` | The identity assumed by application code inside containers. Currently has no permissions — services communicate with each other internally, not via AWS SDK calls. |
| `peerprep-github-actions-role` | Assumed by GitHub Actions via OIDC (no stored credentials). Allows CI/CD to push images to ECR and trigger ECS redeployments. Scoped to pushes from the `main` branch only. |

### AWS Cloud Map + ECS Service Connect
Provides internal DNS-based service discovery between ECS tasks. Each service registers itself under the `peerprep.local` namespace and becomes reachable by its short name (e.g. `http://user-service:4001`) from any other service in the cluster — the same URLs used in Docker Compose, requiring no code changes.

### Amazon CloudWatch Logs
All container stdout/stderr is streamed here automatically via the `awslogs` log driver. Each service writes to its own log group (`/peerprep/<service-name>`).

---

## VPC Structure

```
Region: ap-southeast-1 (Singapore)
VPC: 10.0.0.0/16  (peerprep-vpc)

                        Internet
                           │
                 ┌─────────▼──────────┐
                 │  Internet Gateway  │  igw-070d86100bf7c9946
                 └─────────┬──────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐           ┌──────────▼─────────┐
│  Public Subnet 1a  │           │  Public Subnet 1b  │
│  10.0.1.0/24       │           │  10.0.2.0/24       │
│                    │           │                    │
│  ┌──────────────┐  │           │                    │
│  │ NAT Gateway  │  │           │                    │
│  │ (Elastic IP) │  │           │                    │
│  └──────────────┘  │           │                    │
│                    │           │                    │
│  ┌──────────────────────────────────────────────┐   │
│  │           Application Load Balancer           │   │
│  │         (spans both public subnets)           │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┘           └────────────────────┘
          │                                 │
          │   (private traffic only)        │
          │                                 │
┌─────────▼──────────┐           ┌──────────▼─────────┐
│  Private Subnet 1a │           │  Private Subnet 1b │
│  10.0.3.0/24       │           │  10.0.4.0/24       │
│                    │           │                    │
│  ECS Fargate tasks │           │  ECS Fargate tasks │
│  (any service)     │           │  (any service)     │
│                    │           │                    │
│  ElastiCache Redis │           │                    │
└────────────────────┘           └────────────────────┘
```

### Subnets

| Subnet | CIDR | AZ | Purpose |
|---|---|---|---|
| peerprep-public-1a | 10.0.1.0/24 | ap-southeast-1a | ALB, NAT Gateway |
| peerprep-public-1b | 10.0.2.0/24 | ap-southeast-1b | ALB (second AZ required by ALB) |
| peerprep-private-1a | 10.0.3.0/24 | ap-southeast-1a | ECS tasks, ElastiCache |
| peerprep-private-1b | 10.0.4.0/24 | ap-southeast-1b | ECS tasks |

### Route Tables

**Public route table** (attached to both public subnets):
| Destination | Target | Meaning |
|---|---|---|
| 10.0.0.0/16 | local | Stay inside VPC |
| 0.0.0.0/0 | Internet Gateway | All other traffic exits to internet |

**Private route table** (attached to both private subnets):
| Destination | Target | Meaning |
|---|---|---|
| 10.0.0.0/16 | local | Stay inside VPC |
| 0.0.0.0/0 | NAT Gateway | Outbound-only internet access (e.g. to reach MongoDB Atlas, external APIs) |

### Security Groups

Three security groups enforce a strict traffic layering — no layer can be bypassed:

**`peerprep-alb-sg`** (attached to ALB):
| Direction | Protocol | Port | Source/Dest |
|---|---|---|---|
| Inbound | TCP | 443 | 0.0.0.0/0 |
| Inbound | TCP | 80 | 0.0.0.0/0 |
| Outbound | All | All | peerprep-ecs-sg |

**`peerprep-ecs-sg`** (attached to all ECS tasks):
| Direction | Protocol | Port | Source/Dest |
|---|---|---|---|
| Inbound | All | All | peerprep-alb-sg |
| Outbound | TCP | 443 | 0.0.0.0/0 (MongoDB Atlas, AI API) |
| Outbound | TCP | 6379 | peerprep-redis-sg |

**`peerprep-redis-sg`** (attached to ElastiCache):
| Direction | Protocol | Port | Source/Dest |
|---|---|---|---|
| Inbound | TCP | 6379 | peerprep-ecs-sg |

### Traffic Flow

**Browser → Frontend (HTTPS):**
```
Browser → Internet Gateway → ALB (TLS termination) → ECS frontend task
```

**Browser → Collaboration Service (WSS):**
```
Browser → collab.peerprep-g11.online → Internet Gateway
       → ALB (host rule: collab.peerprep-g11.online, TLS termination)
       → ECS collaboration-service task (plain ws:// inside VPC)
```

**HTTP → HTTPS redirect:**
```
Browser HTTP:80 → ALB → 301 redirect to HTTPS:443
```

**Service-to-service (internal):**
```
ECS task A → Service Connect DNS (e.g. http://question-service:8000)
           → ECS task B  (stays inside private subnet, never leaves VPC)
```

**ECS task → MongoDB Atlas / external API:**
```
ECS task → NAT Gateway (private subnet → public subnet)
         → Internet Gateway → internet
```

---

## CI/CD Flow

```
git push / PR merge to main
        │
        ▼
GitHub Actions (OIDC — no stored AWS credentials)
        │
        ├── dorny/paths-filter: detect which services changed
        │
        └── For each changed service (parallel):
              ├── docker build (frontend: passes NEXT_PUBLIC_COLLAB_SERVICE_WS_URL as build arg)
              ├── docker push → ECR
              └── aws ecs update-service --force-new-deployment
                        │
                        ▼
                  ECS rolling deploy:
                  start new task → health check passes → drain old task
```

Only services with changed files are rebuilt and redeployed. Unchanged services are skipped.
