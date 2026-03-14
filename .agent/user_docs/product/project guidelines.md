## CS3219 AY2526S 2 Project

- Maximum marks:
- Expected Learning outcomes Contents
- Organizing work within your Project Team
- Reuse policy and declaration
- Code hosting/management
- Project context......................................................................................................................................
- Choice of architecture
- PeerPrep Features
- Project Milestones
- Milestone D1: Requirements Specification
      - Tasks:
      - Evaluation
- Milestone D2: Progress Check -
   - Decisions to be Checked
   - Rubric for Each Decision
      - Example (Question Service)
- Milestone D3: Progress Check -
   - Decisions to be Checked
   - Rubric for Each Decision
- Milestone D4: Final Submission & Presentation
   - Deliverables
   - Submission Instructions
   - Evaluation Criteria
- Appendix 1: Setting up of team on GitHub Classroom
- Appendix 2: Declaration
- Appendix 4: Sample data


## Expected Learning outcomes Contents

1) You should be able to apply the concepts learned in the lectures in a real-world
context by designing a useful application that can be added to your portfolios.
2) You should be able to extend your existing software engineering knowledge by:

```
a) developing a requirements specification (containing both functional and
non-functional requirements),
b) developing an architectural design specification that satisfies the
requirement specification, and
c) designing and developing an application following relevant design principles
and patterns.
```
3) You should be able to explore various architectures and design decisions in
implementing the features of the product.

4) You should be able to improve your communication skills (technical and non-
technical) through collaborative group work, technical documentation
writing, and presentations.

## Organizing work within your Project Team

1) Each project team will have 5 members (there will be no workload adjustments for 4 -

member teams; teams of 3 or fewer are disallowed).
a) For better collaboration, it is strongly encouraged to form teams within the same
tutorial.
2) Allocate the responsibility of completing the product features (i.e., must-haves and nice-

to-haves) and the remaining project tasks (i.e., documentation, demo, and
presentations) roughly equally among the team members.
3) Keep a note of the individual contributions. This will be factored in while grading the

```
project components and marks for individual members may differ.
a) You are required to declare your role allocation and responsibilities in the final
presentation.
b) Additionally, we will use peer reviews and mentors’ feedback to gather information
about the individual contributions and team dynamics. The teaching team will
intervene if necessary.
```
4) A mentor will be allocated to each project team.

## Reuse policy and declaration

```
1) Each group is expected to sign a declaration (see Appendix 2) that the project is bona
fide work of the team.
2) If any code is reused, or any reference is made to an existing design or documentation,
acknowledge the source(s).
3) Attach this declaration to your final submission (the presentation slides) before
submitting it on Canvas.
4) You are expected to read through the course’s AI usage policy in Appendix 3.
```
## Code hosting/management

We will use a GitHub Classroom assignment repository to track your project progress. You are
required to use a single repository and create a folder for each microservice/component. See

Appendix 1 for setting up the team and the project repository.


## Project context......................................................................................................................................

```
This Project involves designing and developing a technical interview preparation platform
and peer matching system called PeerPrep, where students can find peers to practice
whiteboard-style interview questions^1 together. A general description of the use of PeerPrep,
also the context, is ( but not limited to ) as follows:
A user who is keen to prepare for their technical interviews visits the
PeerPrep site. They create an account and then log in. After logging in, the
user selects the question difficulty level (easy, medium, or hard) and a topic
they want to attempt today. The user then waits until they are matched with
another online user who has selected the same difficulty level and topic
choice as them. If they are not successfully matched after a specific
duration, they time out. If they are successfully matched, the users are
provided with an appropriate question and a collaborative space to develop
their solution in real-time. The application should allow the users to
terminate the collaborative session gracefully.
You are encouraged to explore the requirements for such an application without deviating
from its overarching purpose.
```
## Choice of architecture

```
To design/implement PeerPrep, we suggest exploring and using a microservices
architecture. If your team decides to use any other architecture, please contact
t h e lecturer and your mentor by the end of Week 6 at the latest and get their
approval. You are free to choose the technology stack to implement PeerPrep.
```
## PeerPrep Features

The following are some of the features envisioned for PeerPrep. Its UI is expected to be
designed for a 13-inch screen or device (e.g., a basic laptop or larger). It is not envisioned as
a responsive design for various screen sizes. However, it could be designed to work with
various browsers.
Here, we refer to them as microservices because our guidance is based on the
microservices architecture. The following are the **must-have features** (labeled Mx) of
PeerPrep.

- M1: User Service – responsible for managing user profiles and role-based access
    controls in the application
- M2: Matching Service – responsible for matching users based on reasonable criteria
    (e.g., question topics and difficulty levels, user proficiency levels). This service can
    be developed to support multiple matching criteria, with topic prioritized over
    everything else.
- M3: Question service – responsible for maintaining a reasonable-sized question
    repository indexed by difficulty level and other criteria (e.g., specific topics,
    popularity). Evolvable as needed, to update and purge questions. It provides a good
    amount of flexibility to store and retrieve questions, and the type of details stored in
    the questions. For example, retrieving questions on the fly during session initiation,

(^1) A whiteboard coding interview is a technical evaluation method used by employers to assess a candidate's
problem-solving and programming skills in real time. Unlike take-home assignments or multiple-choice coding
tests, this interview requires candidates to write code on a physical or online whiteboard or code editor,
explaining their thought process while solving complex algorithmic problems. (From:
https://www.pmapstest.com/blog/what-is-whiteboard-coding-interview)


```
and supporting images within questions.
```
- M4: Collaboration service – provides the mechanism for real-time collaboration
    (e.g., real-time, concurrent code editing) between authenticated and matched
    users in the collaborative space.
- M5: Basic UI for user interaction – to access the app that you develop.
- M6: Deploying the application on your local machine (e.g., laptop) using containers.

The following are the **nice-to-have (N2H)** categories (labeled Nx) for PeerPrep. The items
listed under each category represent a wish list from the teaching team—they are neither

exhaustive nor prescriptive. Your team is free to design, adapt, and extend them based on
your interpretation. We also do not require you to limit yourselves strictly to the listed N2H

categories. If your team identifies features that are more relevant to the PeerPrep project
context and better aligned with its objectives, you are welcome to propose and implement

them instead. Be sure to discuss your ideas with your mentor and lecturer before moving
forward, to ensure they fit within the project's scope.

```
Before implementing the N2H, you should discuss your chosen direction with your
mentor and lecturer. While there is no limit on the number of N2H you can implement, we
suggest ensuring:
i. The work distribution is roughly equal within the team.
ii. You don’t pick too many N2H that will increase your workload!
```
When you develop your N2H, we want you to demonstrate its relevance to PeerPrep and its
technical implementation, showcasing your team’s strengths.

```
Please note that these concepts will not be explicitly covered in lectures or tutorials, so
your team is encouraged to conduct independent research and design.
```
```
N1: Service enhancements
```
```
This category focuses on improving the collaboration and learning
experience in PeerPrep by extending the capabilities of the platform’s core
services. Possible directions include (but are not limited to):
```
**1. Enhanced code editor**
    a. Add support for code formatting.
    b. Provide syntax highlighting for a single language or multiple languages.
**2. Improved communication tools**
    a. Introduce additional communication channels beyond the
       shared coding workspace. For example, include text-based
       chat, voice calls, or integrated video calling to support
       richer collaboration.
**3. Question attempt history**
    a. Maintain a record of all questions attempted by each user.
    b. Store metadata such as attempt timestamps, submitted solutions,
       and suggested solutions.
    c. Provide a way for users to review and reflect on their past attempts.
**4. Code execution environment**
    a. Implement sandboxed code execution for attempted solutions.
    b. Capture and present the output directly within the
       collaborative workspace.
    c. Ensure safe execution with resource limits and security isolation.


**N2: AI Features**

This category explores integrating **generative AI** into PeerPrep to provide intelligent
assistance during preparation. Potential directions include (but are not limited to):

**1. AI-assisted explanations**
    o Allow users to request explanations of code written by their peers.
    o Integrate with services such as ChatGPT, Copilot, or similar to
       generate contextual, human-readable explanations.
**2. AI-assisted problem solving**
    o Enable users to prompt generative AI directly within the
       PeerPrep interface.
    o Use AI to suggest possible solutions, explain problem
       statements, or provide hints while solving coding questions,
       within appropriate limits
**3. Conceptual expansion**
    o Extend AI support to tasks such as test-case generation,
       debugging suggestions, or refactoring recommendations.
    o Enable customizable AI modes (e.g., “explain like I’m a beginner”
       vs. “give me an optimization hint”).
**4. Code translation between languages**
    o Enable automatic translation of code from one language to
       another (e.g., JavaScript ⇄ Python).
    o Allow each participant to view the shared solution in their
       **preferred programming language** (e.g., user A in Python, user B
       in JavaScript).
**5. Open-ended innovations**
    o You are encouraged to conceptualize and prototype additional
       AI-driven features that could meaningfully enhance the
       PeerPrep experience.
    o Any such ideas should be discussed with your mentor and
       lecturer before implementation.


**N3.: Integration, Testing and Deployment**

This category allows you to hone your CI/CD and DevOps skills.

1. **Extensive testing (CI)**
    Do extensive automated unit/integration/system testing, and browser
    compatibility, demonstrating the effective use of CI in the
    development process; for example:
       a. **Automated tests:** unit, integration, end-to-end/system.
       b. **Coverage targets:** e.g., ≥80% lines for core services; critical
          paths at 100% branch coverage.
       c. **Cross-browser testing:** define supported browsers and pass
          criteria.
       d. **Non-functional tests:** load, stress, and failure-injection
          scenarios with pass/fail thresholds.
       e. **CI:** build → test → security scan → artifact versioning.
2. **Deployment strategies and modes (CD)**
    a. **Cloud deployment:** Deploy the app on a cloud platform (e.g.,
       AWS, GCP, or others) similar to production systems.
    b. **CD:** automated deploy to staging, manual/auto-gated promote to
       production.
    c. **Infra as Code:** reproducible envs (e.g., Terraform/CloudFormation),
       immutable images.
    d. **Rollbacks:** documented strategy (blue/green or canary) with clear
       MTTR goals.
3. **Scalability**
    The deployed application should demonstrate easy scalability of
    some form. An example would be using a Kubernetes horizontal pod
    autoscaler to scale up the number of application pods during high
    load.
    **Show Scalability plan**
       a. Horizontal/vertical scaling triggers (CPU, latency, Q depth).
       b. Stateful vs. stateless components; session affinity strategy if needed.
       c. Async patterns: queues/streams, outbox, sagas, exactly-once/at-
          least-once handling.
4. **Other deployment considerations**
    These usually go hand-in-hand with scalability and fault tolerance.
    **Service registry / discovery**
       a. Chosen mechanism (e.g., Consul, Eureka, AWS Cloud Map,
          Kubernetes DNS).
       b. Registration/health-check protocol, TTLs, and how clients
          resolve endpoints.
       c. Failure handling (stale instances, partial partitions).
    **API gateway**
       d. Gateway selection (managed vs. self-hosted), routing rules, auth,
          rate limits.
       e. Request/response transformation, header policies, CORS, and
          version routing.
       f. Canary/shadow traffic strategy and circuit breaking at the edge.


## Project Milestones

To facilitate incremental work on the project, we have 4 graded milestones during the

semester. A summary is provided in the table below.

```
Mile stone Deliverable
```
```
Weightage
(percentage)
```
```
Submission Format and
Deadline
```
```
D1 Requirements
specification.
```
```
5 1/ F2F presentation to the
lecturer + TA/mentor before the
end of Week 5 (Between Feb
12 - 14 , 2026 );
```
```
2/ Backlog document submission
on Canvas before Mar 7, 2026
D2 Progress Check - 1 8 1/ F2F presentation (including
demonstration) to mentor
between Week 7 and Week 9
(complete by Mar 20, 2026)
D3 Progress Check - 2 12 1/ F2F presentation (including
demonstration) to mentor
between Week 8 and Week 11
(complete by Apr 3, 2026)
D4 Full^ project^
demonstration with
slides.
```
```
25 1/ Slides to be submitted and
product final commit by Apr 16,
2026 , 10:00 hrs.
```
```
2/ 30 min presentation with
demo to graders before the end
of Week 13 (between Apr 16-
18 , 2026)
```
```
Demo slot selection will open a
week before.
```
For any queries, post to MS-Teams channel “Clarifications [Project]” or reach out to your
project mentor.


## Milestone D1: Requirements Specification

**Weightage:** 5 points
**When:** by Week 5

#### In this milestone, you will develop:

- The project requirements in the form of a product backlog.
- Wireframe or prototype user interface of the various product features

#### Tasks:

1. Refer to the must-have features of PeerPrep, M1 to M4. Treat the feature description
    as the high-level capabilities that the customer expects from the product.
       a. Analyze the feature capabilities, think through them, and write the
          requirements for each of these features; refine each high-level requirement^2
          at least two levels of refinement/decomposition. This milestone expects you
          to apply requirements analysis and requirements specification concepts.
       b. The requirements should be categorized (e.g., FR/NFR), indexed, and
          prioritized. You can refer to the example screenshot in the lecture notes (L2-
          Requirements-PeerPrepReqEg.pdf, Slide 9 )
2. Refer to the must-have feature M5 of PeerPrep. Envision what the user interface
    would look like when you access M1 to M4 features. You can code, OR draw legible
    wireframe diagrams, OR make a prototype of^ the UI^3.
3. Refer to the nice-to-have categories of PeerPrep, N1 to N3. Decide on the N2H your
    team wishes to explore and develop in the project. Capture the key requirements for
    these identified nice-to-haves and document them briefly (in about 2 - 3 lines each)
    at the end of the product backlog. You can revise, refine, and elaborate on them
    during Milestone D2, D3 or before Milestone D 4.

#### Evaluation

- Towards the end of **Week 5,** we will open up a 30-minute slot for each team to present
    their product backlog to the teaching team (lecturer + TA/mentor). You are
    encouraged to prepare a simple slide deck for your presentation. (Note:
    beautification of slides carries no marks! So, don’t spend time on it.)
- Ensure all team members are present. Avoid reading from a script while presenting
    your work.

```
For clarifications on this milestone:
```
- Use the MSTeams channel “Clarifications [Project]” to seek clarifications from the
    teaching team.
- Please title the post appropriately so that the discussion/response is beneficial for
    everyone. Indicate your team number in the query title.
       o E.g., “[Project Group 1] How many slides should we prepare?”

(^2) Note: Avoid rewording the given feature description, e.g., “M1: User Service – responsible for managing
user profiles and role-based access controls in the application” should not be reworded to “The system
should provide a user service to manage user profiles and RBAC”. You may not get any marks for simply
rewording the given features.
(^3) Note: The wireframe can be drawn using any simple diagram software like Balsamiq or PowerPoint. You
are NOT required to use any sophisticated software for this task.


## Milestone D2: Progress Check -

**Weightage:** 8 points
**When:** Weeks 7 – 9

```
Milestone D2 is an early progress check. The goal is to ensure your team has made
concrete design and implementation decisions for the two core services (User and
Question) and that you are on track to deliver a complete system.
```
- You are given a basic implementation of the user service.
    o Your task is to enhance this with role-based access control, so that you can
       distinguish between different types of users (e.g., non-exhaustively:
       administrators, registered users, etc.) and allow different kinds of access to
       PeerPrep.
    o Note: you are free to re-implement the entire user service if you wish, using third-
       party libraries/tools/services. However, you should ensure that the PeerPrep
       data remains under your control
- Question service is primarily designed to be a backend service.
    o However, for the convenience of users, you are required to develop a single-page
       application to allow CRUD operations.
- You are required to integrate the two services appropriately.
    o You may choose to containerize the services early (check for containerization in
       D3) for convenience, but no marks are allocated for containerization in this
       milestone.

```
You are expected to arrange a face-to-face meeting with your mentor (anytime between
Week 7 – 9 ) to walk through your team’s progress.
```
### Decisions to be Checked

(2 X 3 points each + 2 integration)

**1. User service (Enhancement decision)**
    o Roles provided and the reasoning behind them
    o Capabilities of the roles
    o Implementation decision (how you go about implementing the
       enhancement)
**2. Question service (Database decision)**
    o Choice of database.
    o How will data be modeled and queried?
    o How does it integrate with other services?
**3. Service integration**
    o How is user service used in question service?

### Rubric for Each Decision

```
Points for each of the above decision points would be awarded based on the following criteria:
```
- Clear concept and decision validated by mentor.
- Reasonable/viable approach, with some edge cases considered and
    awareness of integration with other services.
- Basic implementation/prototype exists to demonstrate feasibility.
Full credit can be earned for strong clarity, feasibility, and planning.

#### Example (Question Service)

- Database chosen, schema outlined, consideration of scaling (2 points).


- Query patterns, integration with matching service (1 point).
- Basic implementation of schema + CRUD API (1 point).
Your mentor will check progress using the following checklist.
- Clarity of conceptual and logical design.
- Technology stack decisions.
- Storage choice and justification.
- Evidence of implementation.

```
Come prepared with concept diagrams, short l i v e demos, and a concise explanation of
your decisions. This check is not about being “done,” but about showing clear direction
and early progress.
```
Note: You will be given feedback about your presentation and demo, which you can use to
improve the final product. The evaluation done at this stage is final (i.e., you will not be able to
resubmit for higher marks based on the feedback received for this milestone)


## Milestone D3: Progress Check -

**Weightage:** 12 points
**When:** Weeks 8 – 11

```
Milestone D3 is roughly a mid-project progress check. The goal is to ensure your team
has made concrete design and implementation decisions acoss the core services and
that you are on track to deliver a complete system.
```
- Your tasks in this milestone are:
    o To design and develop the collaboration service
    o To containerize the core services
    o To integrate various core services
    o To finalize the N2H you are targeting and the role allocation

```
You are expected to arrange up to 3 face-to-face meetings (each no more than 30 minutes long)
with your mentor (anytime between Week 8 – 11 ) to walk through your team’s progress.
```
### Decisions to be Checked

(3 X 4 points each)

**1. Matching service (Design decisions)**
    o Matching algorithm and criteria (e.g., skill level, availability).
    o Does the matching algorithm use any queuing mechanism?
    o How edge cases are handled (e.g., no matches, simultaneous requests).
    o Integration with collaboration service.
**2. Collaboration service (Technology decision)**
    o Selected technology stack (e.g., WebRTC, WebSockets, shared
       editor framework).
    o Architectural decisions to support real-time interactions.
    o View toward scaling and compatibility with other services.
**3. Service containerization (Implementation & deployment decisions)**
    Some of these decisions would depend on choice of nice-to have you have finalized
       o Chosen approach to containerize must have services.
       o Deployment workflow and CI/CD considerations.
       o Alignment with scalability and production readiness.
          1. Implementation tech stack: language/runtime versions,
             package manager, framework; base image choice; Dockerfile
             strategy, dependency/security scanning, image
             tagging/versioning.
          2. Configuration & secrets: env vars, secret management
             (e.g., SSM/Secrets Manager/K8s Secrets)
          3. Networking & ingress: service-to-service communication,
             ingress/controller choice, ports, API gateway/ingress rules.
          4. CI/CD & rollout: pipeline stages (build→test→scan→push→deploy),
             promotion flow (dev→staging→prod), rollout strategy (rolling/blue
             green/canary), rollback plan.
          5. Observability: logs/metrics/traces, health checks
             (liveness/readiness), dashboards & alerts.
**4. Nice-to-have features (Role allocation)**
    (This item is graded on an S/U basis)
       o Team’s decision on which N2H to pursue (finalized), and the plan.
       o Allocation of responsibilities to team members.
       o Depth of thought into PeerPrep relevance and technical feasibility.


### Rubric for Each Decision

```
Points for each of the above decision points would be awarded based on the following criteria:
```
- Clear concept and decision validated by mentor.
- Reasonable/viable approach, with some edge cases considered and
    awareness of integration with other services.
- Basic implementation/prototype exists to demonstrate feasibility.

```
Note: The implementation of some of the things need not be 100% complete at this stage.
E.g., you may not have implemented everything you aimed to do for collaboration service.
You can still earn full credit for strong clarity, feasibility, and planning.
```
```
Your mentor will check progress using the following checklist.
```
- Clarity of conceptual and logical design.
- Technology stack decisions.
- Storage choice and justification.
- Deployment strategy.
- Selection and role allocation for Nice-to-Haves.
- Evidence of implementation.

```
Come prepared with concept diagrams, short l i v e demos, and a concise explanation of
your decisions. This check is not about being “done,” but about showing clear direction
and early progress.
```
Note: You will be given feedback about your presentation and demo, which you can use to
improve the final product. The evaluation done at this stage is final (i.e., you will not be able to
resubmit for higher marks based on the feedback received for this milestone)


## Milestone D4: Final Submission & Presentation

**Weightage:** 25 points
**When:** Week 13

Objective of this milestone is to showcase your completed PeerPrep system, explain your
design and implementation decisions, and reflect on your team’s contributions.

### Deliverables

1. **Demo**
    o A **well-prepared live product demonstration** showing your system in
       action.
    o Use **prepared scenarios and test data** to highlight the main workflows
       (e.g., user matching, collaboration, question solving).
    o Cover at least the **core services** (Question, Matching, Collaboration).
    o If deployed online, demonstrate using the **deployment link**.
       Otherwise, demonstrate the system running locally or in containers.
       **Declare** which mode you are using during the demonstration.
2. **Presentation slides** (See submission instructions)
    Your slides should be concise (~15- 20 slides) and include, but not limited to:
       o **Team introduction** → team name, role/task allocation per member.
       o **Tech stack** → languages, frameworks, databases, tools.
       o **Architecture and/or deployment diagram** → microservices layout, data
          flow, key integrations.
       o The following **key decisions:**
          ▪ Database choice for the key services and the patterns used.
          ▪ Implementation & deployment strategy for services.
          ▪ Collaboration design and interaction with other services.
          ▪ Matching algorithm design.
          ▪ Nice-to-Have feature(s): highlight those where specific technologies
             or approaches were used, which can distinguish your work from
             others
          ▪ Any other decision that you made when designing/implementing
             PeerPrep
       o **Repository link** → GitHub repo with clear README.
       o **Deployment link** (if available).
       o **Supporting documentation link** (if prepared) → e.g., runbooks, API docs,
          design docs.
       o **Signed declaration (See Appendix 2 )**

### Submission Instructions

- **Submission date: April 16, 2026, 10:00 AM (including final code commit)**

#### • Upload your presentation slides to CANVAS under PeerPrep Presentation.

- Use the filename format: **ProjectGroup<number>.pptx**
    (e.g., ProjectGroup5.pptx)
- If you have **additional files** (e.g., documentation, readme, runbook,
    diagrams, secrets that are necessary to run the application), submit
    them to the separate assignment, PeerPrep Other Documents as a
    **separate zip file**.
       o Create a **single ZIP file** containing your all additional files.
       o **ZIP filename format:** ProjectGroup<number>-additionalfiles.zip
          (e.g., ProjectGroup5-additionalfiles.zip).


### Evaluation Criteria

- **Clarity** → slides are well-structured, concise, and easy to follow.
- **Completeness** → demo + slides together cover architecture, tech choices, team
    contributions, and key decisions.
- **Technical depth** → rationale for decisions is explained; trade-offs and
    integration considerations addressed.
- **Team contribution** → roles/tasks are clear; each member demonstrates ownership.
- **Professionalism** → delivery, flow, and timing of presentation. Avoid reading from
    scripts.
- **Product demonstration** → Focus on **showing the system in action** and
    **explaining why you made your choices** rather than covering every minor detail.
- **Test data and storyline** → Seed **sample users, questions, and scenarios**
    ahead of time so the flow looks smooth.
    - Use meaningful names for users and have meaningful questions populated
       in the database.
    - Use the demo to **tell a story** (e.g., “Two users get matched, collaborate on a
       question, and review their history”). Rehearse your demo to avoid surprises.


## Appendix 1: Setting up of team on GitHub Classroom

We will be using GitHub Classrooms to monitor and track your project progress.

1. You are expected to use the template repository to manage your project codebase. The
    teaching team should be given access to the repositories as we may require viewing the
    history of the repository in case of any disputes or disagreements. Please follow these
    instructions to set up your GitHub repository using GitHub Classrooms.
2. Select ONE representative to click on the GitHub Classroom invitation link:
    https://classroom.github.com/a/HpD0QZBI
3. This representative should then be directed to this page
4. Your team representative must now create your new team: G<Team Number> (E.g.,
    G01), based on the team number from Canvas
5. Click "+ Create team"
6. Once you click the button, your team will be successfully created. Then, GitHub will
    ask you to accept the assignment.

```
Proceed to accept the assignment.
```
7. You will be redirected to the "Creating your repository" page. Wait for a few moments
    while the repository is created.
8. Once ready, you will be redirected to access your repository at:
    https://github.com/CS3219-AY2526S2/peerprep-<project_group_name>
9. All other team members should now access the GitHub classroom link:
    https://classroom.github.com/a/HpD0QZBI
10. Please select your team _G<Team Number>_ under "Join an existing team" and click
    "Join".


11. You will be directed to a "You're ready to go" confirmation page that you have joined

```
the team.
```
12. Click on the link to go to the assignment repository, and you will be directed to

```
the repository.
```

## Appendix 4: Sample data

Your team can choose to use the following sample questions in the project. Note that this is
not an exhaustive list of questions!

```
Questio
n Id
```
```
Question Title Question
Description
```
```
Question
Categorie
s
```
```
Question
Complexity
```
```
Link
```
```
1 Reverse
a String
```
```
Write a function that
reverses a string. The
input string is given
as an array of
characters s.
You must do this
by modifying the
input array in-
place with O(1)
extra memory.
```
```
Example 1:
```
```
Input: s =
["h","e","l","l","o"]
Output:
["o","l","l","e","h"]
Example 2:
```
```
Input: s =
["H","a","n","n","a","
h"]
Output:
["h","a","n","n","a","
H"]
```
```
Constraints:
1 <= s.length <= 10^5
s[i] is a printable
ascii character.
```
```
Strings,
Algorithm
s
```
```
Easy https://leetc
ode.com/pr
o
blems/rever
s e-string/
```
```
2 Linked^ List
Cycle
Detection
```
```
Implement a
function to detect if
a linked list
contains a cycle.
```
```
Data
Structures
,
Algorithm
s
```
```
Easy https://leetc^
ode.com/pr
o
blems/linke
d
```
- list-cycle/
3 Roman
to
Integer

```
Given a roman
numeral, convert it
to an integer.
```
```
Algorithm
s
```
```
Easy https://leetc
ode.com/pro
blems/roma
n
```
- to-integer/


4 Add Binary Given two binary
strings a and b,
return their sum as a
binary string.

```
Bit
Manipula
t ion,
```
```
Easy https://leetc
ode.com/pro
blems/add-
binary/
```

Algorithm
s
5 Fibonacci
Number

```
The Fibonacci
numbers,
commonly denoted
F(n) form a
sequence, called
the Fibonacci
sequence, such
that each number is
the sum of the two
preceding ones,
starting from 0 and
```
1. That is,
F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n -
2), for n > 1.
Given n, calculate
F(n).

```
Recursion
,
Algorithm
s
```
```
Easy https://leetc
ode.com/pr
o
blems/fibon
a cci-
number/
```
```
6 Implemen
t Stack
using
Queues
```
```
Implement a last-
in-first-out (LIFO)
stack using only
two queues. The
implemented stack
should support all
the functions of a
normal stack
(push, top, pop,
and
empty).
```
```
Data
Structures
```
```
Easy https://leetc^
ode.com/pr
o
blems/imple
ment-stack-
using-
queues/
```

7 Combine Two
Tables

```
Given table Person
with the following
columns:
```
1. personId (int)
2. lastNam
    e
    (varchar)
3. firstNam
    e
    (varchar)
personId is the
primary key.
And table
Address with the
following
columns:
1. addressI
d (int)
2. personId (int)
3. city (varchar)
4. state
(varchar
)
addressId is
the primary
key.
Write a solution to
report the first
name,

```
Databas
e s
```
```
Easy https://leetc
ode.com/pr
o
blems/comb
i ne-two-
tables/
```

last name, city, and
state of each
person in the
Person table. If the
address of a
personId is not
present in the
Address table,
report null instead.
Return the result
table in any order.
8 Repeate
d DNA
Sequences

```
The DNA
sequence is
composed of a
series of
nucleotides
abbreviated as 'A',
'C', 'G', and 'T'.
```
```
For example,
"ACGAATTCCG" is
a
DNA sequence.
When studying
DNA, it is useful to
identify repeated
sequences within
the DNA.
```
```
Given a string s
that represents a
DNA sequence,
return all the 10 -
letter-long
sequences
(substrings) that
occur more than
once in a DNA
molecule. You may
return the answer in
any order.
```
```
Algorithm
s, Bit
Manipula
t ion
```
```
Medium https://leetc^
ode.com/pro
blems/repea
t ed-dna-
sequences/
```

9 Course
Schedule

```
There are a total of
numCourses
courses you have
to take, labeled
from 0 to
numCourses - 1.
You are given an
array prerequisites
where
prerequisites[i] =
[ai, bi] indicates
that you must take
course bi first if you
want to take course
ai.
For example, the pair
[0, 1], indicates that
```
```
Data
Structures
,
Algorithm
s
```
```
Medium https://leetc
ode.com/pr
o
blems/cours
e-schedule/
```

to take course 0 you
have to first take
course 1.
Return true if you
can finish all
courses.
Otherwise,
return false.
10 LRU Cache
Design

```
Design and
implement an LRU
(Least Recently
Used) cache.
```
```
Data
Structures
```
```
Medium https://leetc
ode.com/pr
o blems/lru-
cache/
11 Longest
Common
Subsequence
```
```
Given two strings
text1 and text2,
return the length of
their longest
common
subsequence. If
there is no
common
subsequence, return
0.
A subsequence of a
string is a new
string generated
from the original
string with some
characters (can be
none) deleted
without changing
the relative order of
the remaining
characters.
```
```
For example, "ace"
is a subsequence
of "abcde".
A common
subsequence of two
strings is a
subsequence that is
common to both
strings.
```
```
Strings,
Algorithm
s
```
```
Medium https://leetc
ode.com/pr
o
blems/longe
st-common-
subsequenc
e/
```
```
12 Rotate Image You are given an n x
n 2D matrix
representing an
image, rotate the
image by 90 degrees
(clockwise).
```
```
Arrays,
Algorithm
s
```
```
Medium https://leetc
ode.com/pr
o
blems/rotat
e
```
- image/
13 Airplane Seat
Assignment
Probability

```
n passengers
board an airplane
with exactly n
```
```
Braintea
s er
```
```
Medium https://leetc^
ode.com/pr
o
```

seats. The blems/airpla


first passenger
has lost the ticket
and picks a seat
randomly. But
after that, the rest
of the passengers
will:
Take their own seat if
it is still available,
and
Pick other seats
randomly when they
find their seat
occupied

```
Return the
probability that the
nth person gets his
own seat.
```
```
ne-seat-
assignment
```
-
probability/

```
14 Validate
Binary
Search Tree
```
```
Given the root of a
binary tree,
determine if it is a
valid binary search
tree (BST).
```
```
Data
Structures
,
Algorithm
s
```
```
Medium https://leetc
ode.com/pr
o
blems/valid
a te-binary-
search-tree/
15 Sliding
Window
Maximum
```
```
You are given an
array of integers
nums, there is a
sliding window of
size k which is
moving from the
very left of the array
to the very right.
You can only see
the k numbers in
the window. Each
time the sliding
window moves right
by one position.
Return the
max sliding
window.
```
```
Arrays,
Algorithm
s
```
```
Hard https://leetc
ode.com/pro
blems/slidin
g
```
- window-
maximum/

##### 16 N-

```
Queen
Problem
```
```
The n-queens puzzle
is the problem of
placing n queens
on an n x n
chessboard such
that no two
queens attack
each other.
Given an integer n,
return all distinct
```
```
Algorithm
s
```
```
Hard https://leetc
ode.com/pr
o blems/n-
queens/
```

solutions to the n-
queens puzzle. You
may return the
answer in any
order.
Each solution
contains a distinct
board configuration
of the n-queens'
placement, where
'Q' and '.' both
indicate a queen
and an empty
space,
respectively.
17 Serialize
and
Deserialize
a Binary
Tree

```
Serialization is the
process of
converting a data
structure or object
into a sequence of
bits so that it can
be stored in a file or
memory buffer, or
transmitted across
a network
connection link to
be reconstructed
later in the same or
another computer
environment.
Design an algorithm
to serialize and
deserialize a binary
tree. There is no
restriction on how
your
serialization/deseri
al ization algorithm
should work. You
just need to ensure
that a binary tree
can be serialized to
a string and this
string can be
deserialized to the
original tree
structure.
```
```
Data
Structures
,
Algorithm
s
```
```
Hard https://leetc
ode.com/pr
o
blems/serial
i ze-and-
deserialize-
binary-tree/
```

18 Wildcard
Matchin
g

```
Given an input string
(s) and a pattern
(p), implement
wildcard pattern
matching with
support for '?' and
'*' where:
'?' Matches any
single character.
'*' Matches any
sequence of
characters
(including the empty
sequence).
The matching
should cover the
entire input string
(not
partial).
```
```
Strings,
Algorithm
s
```
```
Hard https://leetc
ode.com/pr
o
blems/wildc
ard-
matching/
```
19 Chalkboar
d XOR
Game

```
You are given an
array of integers
nums represents
the numbers
written on a
chalkboard.
Alice and Bob take
turns erasing
exactly one number
from the
chalkboard, with
Alice starting first.
If erasing a number
causes the bitwise
XOR of all the
elements of the
chalkboard to
become 0, then
that player loses.
The bitwise XOR of
one element is that
element itself, and
the bitwise XOR of
no elements is 0.
```
```
Also, if any player
starts their turn with
the bitwise XOR of
all the elements of
the chalkboard
equal to 0, then that
player wins.
```
```
Braintea
s er
```
```
Hard https://leetc
ode.com/pr
o
blems/chalk
board-xor-
game/
```

Return true if and
only if Alice wins
the game,
assuming
both players play
optimally.
20 Trips^ and
Users

```
Given table Trips:
```
1. id (int)
2. client_id (int)
3. driver_id (int)
4. city_id (int)
5. status
    (enum)
6. request_at(
    d ate)
id is the primary
key. The table
holds all taxi trips.
Each trip has a
unique id, while
client_id and
driver_id are foreign
keys to the
users_id at the
Users table.
Status is an ENUM
(category) type of
('completed',
'cancelled_by_driver'
,
'cancelled_by_client'
).

```
And table Users:
```
1. users_id (int)
2. banned
    (enum)
3. role (enum)
users_id is the
primary key
(column with
unique values) for
this table.
The table holds all
users. Each user
has a unique
users_id, and role
is an ENUM type of
('client', 'driver',
'partner'). banned
is an ENUM
(category) type of

```
Databas
e s
```
```
Hard https://leetc^
ode.com/pr
o
blems/trips-
and-users/
```

('Yes', 'No').
The cancellation rate
is computed by
dividing the
number


of canceled (by
client or driver)
requests with
unbanned users
by the total
number of
requests with
unbanned users
on that day.
Write a solution to
find the
cancellation rate of
requests with
unbanned users
(both client and
driver must not be
banned) each day
between "2013-
10 -
01" and "2013- 10 -
03". Round
Cancellation Rate to
two decimal points.
Return the result
table in any order.


