'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { MatchingPreferences } from '@/app/matching/types';
import { PROGRAMMING_LANGUAGE_LABELS } from '@/lib/programming-languages';

const VB_W = 1400;
const VB_H = 700;
const GROUND_Y = 520;
const PATH_Y = 505;
const PATH_H = 16;

const USER_X = 560;
const NPC_MEET_X = 840;
const NPC_OFF_X = VB_W + 120;

const CLOUD_W = 700;
const FAR_W = 500;
const NEAR_W = 620;

const NPCS = [
    { body: '#d97a6e', hair: '#8B4513', hat: false },
    { body: '#6e8fd9', hair: '#2a2a2a', hat: true },
    { body: '#d9b86e', hair: '#5C3317', hat: false },
    { body: '#9a6ed9', hair: '#1a1a2e', hat: true },
    { body: '#6ed9c0', hair: '#3B2614', hat: false },
];

const MATCH_NPC = { body: '#5bb585', hair: '#4a3520', hat: false };

type Phase =
    | 'pause' | 'approaching' | 'meeting' | 'checking' | 'rejecting' | 'leaving'
    | 'match_enter' | 'match_check' | 'match_celebrate';

const DURATIONS: Record<Phase, number> = {
    pause: 1600,
    approaching: 2200,
    meeting: 600,
    checking: 2400,
    rejecting: 1100,
    leaving: 1800,
    match_enter: 2000,
    match_check: 2000,
    match_celebrate: 2400,
};

const SEARCH_SEQ: Phase[] = ['pause', 'approaching', 'meeting', 'checking', 'rejecting', 'leaving'];
const MATCH_SEQ: Phase[] = ['match_enter', 'match_check', 'match_celebrate'];

function formatTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function CloudShape({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
    return (
        <g transform={`translate(${cx},${cy}) scale(${s})`} opacity={0.55}>
            <ellipse rx={44} ry={17} fill="white" />
            <ellipse cx={-24} cy={5} rx={26} ry={13} fill="white" />
            <ellipse cx={26} cy={5} rx={22} ry={11} fill="white" />
        </g>
    );
}

function FarTile() {
    return (
        <g>
            <rect x={15}  y={GROUND_Y - 155} width={52} height={155} rx={2} fill="#c8ccd4" />
            <rect x={82}  y={GROUND_Y - 105} width={38} height={105} rx={2} fill="#c0c4cc" />
            <rect x={138} y={GROUND_Y - 185} width={65} height={185} rx={2} fill="#cbcfd7" />
            <rect x={220} y={GROUND_Y - 118} width={48} height={118} rx={2} fill="#c4c8d0" />
            <rect x={288} y={GROUND_Y - 150} width={72} height={150} rx={2} fill="#c8ccd4" />
            <rect x={378} y={GROUND_Y - 92}  width={45} height={92}  rx={2} fill="#c0c4cc" />
            <rect x={440} y={GROUND_Y - 130} width={55} height={130} rx={2} fill="#c4c8d0" />
        </g>
    );
}

function NearTile() {
    const b1 = '#a4a9b4';
    const b2 = '#adb2bc';
    const win = '#f8ecc8';
    return (
        <g>
            <rect x={10} y={GROUND_Y - 135} width={68} height={135} rx={3} fill={b1} />
            {Array.from({ length: 4 }, (_, r) =>
                Array.from({ length: 2 }, (_, c) => (
                    <rect key={`a${r}${c}`} x={20 + c * 28} y={GROUND_Y - 125 + r * 30} width={12} height={16} rx={1.5} fill={win} opacity={0.65} />
                )),
            )}
            <rect x={98} y={GROUND_Y - 88} width={50} height={88} rx={3} fill={b2} />
            {Array.from({ length: 2 }, (_, r) => (
                <rect key={`b${r}`} x={112} y={GROUND_Y - 78 + r * 30} width={22} height={14} rx={1.5} fill={win} opacity={0.55} />
            ))}
            <rect x={168} y={GROUND_Y - 165} width={80} height={165} rx={3} fill={b1} />
            {Array.from({ length: 5 }, (_, r) =>
                Array.from({ length: 2 }, (_, c) => (
                    <rect key={`c${r}${c}`} x={180 + c * 32} y={GROUND_Y - 155 + r * 28} width={14} height={15} rx={1.5} fill={win} opacity={0.65} />
                )),
            )}
            <rect x={272} y={GROUND_Y - 44} width={6} height={44} rx={2} fill="#9B8B6E" />
            <ellipse cx={275} cy={GROUND_Y - 54} rx={20} ry={22} fill="#7DB87D" opacity={0.8} />
            <rect x={310} y={GROUND_Y - 108} width={58} height={108} rx={3} fill={b2} />
            {Array.from({ length: 3 }, (_, r) =>
                Array.from({ length: 2 }, (_, c) => (
                    <rect key={`d${r}${c}`} x={320 + c * 22} y={GROUND_Y - 98 + r * 30} width={10} height={16} rx={1.5} fill={win} opacity={0.55} />
                )),
            )}
            <rect x={390} y={GROUND_Y - 142} width={76} height={142} rx={3} fill={b1} />
            {Array.from({ length: 4 }, (_, r) =>
                Array.from({ length: 2 }, (_, c) => (
                    <rect key={`e${r}${c}`} x={402 + c * 28} y={GROUND_Y - 132 + r * 30} width={12} height={16} rx={1.5} fill={win} opacity={0.65} />
                )),
            )}
            <rect x={492} y={GROUND_Y - 55} width={3} height={55} rx={1} fill="#8a8a8a" />
            <circle cx={493.5} cy={GROUND_Y - 58} r={5} fill="#f5e6a0" opacity={0.5} />
            <rect x={525} y={GROUND_Y - 78} width={48} height={78} rx={3} fill={b2} />
            {Array.from({ length: 2 }, (_, r) => (
                <rect key={`f${r}`} x={539} y={GROUND_Y - 68 + r * 30} width={20} height={14} rx={1.5} fill={win} opacity={0.55} />
            ))}
            <ellipse cx={598} cy={GROUND_Y - 6} rx={14} ry={10} fill="#7DB87D" opacity={0.5} />
        </g>
    );
}

interface CharProps {
    bodyColor: string;
    hairColor?: string;
    hasHat?: boolean;
    facingLeft?: boolean;
    walking?: boolean;
    headShake?: boolean;
    celebrate?: boolean;
}

const SWING = { duration: 0.48, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const };
const STOP = { duration: 0.3 };

function Char({ bodyColor, hairColor = '#3B2614', hasHat, facingLeft, walking, headShake, celebrate }: CharProps) {
    const dir = facingLeft ? -1 : 1;
    const t = walking ? SWING : STOP;

    return (
        <motion.g
            animate={celebrate ? { y: [0, -18, 0] } : { y: 0 }}
            transition={celebrate ? { duration: 0.45, ease: 'easeOut' } : { duration: 0.2 }}
        >
            <g transform={`scale(${dir},1)`}>
                <ellipse cy={2} rx={12} ry={3} fill="#000" opacity={0.06} />

                <motion.path
                    d="M -4 -20 L -4 0"
                    animate={walking ? { d: ['M -4 -20 L -9 0', 'M -4 -20 L 1 0'] } : { d: 'M -4 -20 L -4 0' }}
                    transition={t}
                    stroke="#555" strokeWidth={4} strokeLinecap="round" fill="none"
                />
                <motion.path
                    d="M 4 -20 L 4 0"
                    animate={walking ? { d: ['M 4 -20 L 9 0', 'M 4 -20 L -1 0'] } : { d: 'M 4 -20 L 4 0' }}
                    transition={t}
                    stroke="#555" strokeWidth={4} strokeLinecap="round" fill="none"
                />

                <rect x={-10} y={-46} width={20} height={28} rx={7} fill={bodyColor} />

                <motion.path
                    d="M -10 -40 L -10 -26"
                    animate={walking ? { d: ['M -10 -40 L -15 -26', 'M -10 -40 L -5 -26'] } : { d: 'M -10 -40 L -10 -26' }}
                    transition={t}
                    stroke={bodyColor} strokeWidth={3.5} strokeLinecap="round" fill="none"
                />
                <motion.path
                    d="M 10 -40 L 10 -26"
                    animate={walking ? { d: ['M 10 -40 L 15 -26', 'M 10 -40 L 5 -26'] } : { d: 'M 10 -40 L 10 -26' }}
                    transition={t}
                    stroke={bodyColor} strokeWidth={3.5} strokeLinecap="round" fill="none"
                />

                <motion.g
                    animate={headShake ? { rotate: [-8, 8, -6, 4, 0] } : { rotate: 0 }}
                    transition={headShake ? { duration: 0.7, ease: 'easeInOut' } : { duration: 0.25 }}
                    style={{ transformOrigin: '0px -46px' }}
                >
                    <circle cy={-55} r={11} fill="#f0d4a0" />
                    <ellipse cy={-62} rx={11} ry={6} fill={hairColor} />
                    <circle cx={4} cy={-55.5} r={1.8} fill="#333" />
                    <path d="M 2 -50 Q 5 -48 8 -50" fill="none" stroke="#b09070" strokeWidth={1} strokeLinecap="round" />
                    {hasHat && (
                        <>
                            <rect x={-13} y={-70} width={26} height={4} rx={2} fill={bodyColor} />
                            <rect x={-8} y={-81} width={16} height={12} rx={3} fill={bodyColor} />
                        </>
                    )}
                </motion.g>
            </g>
        </motion.g>
    );
}

function Bubble({ x, y, label, color, delay = 0 }: { x: number; y: number; label: string; color: string; delay?: number }) {
    const cw = 6.2;
    const w = Math.max(56, label.length * cw + 28);
    const h = 26;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.35 }}>
            <g transform={`translate(${x},${y})`}>
                <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="white" stroke="#e0ddd4" strokeWidth={1.2} />
                <polygon points="-5,12 0,20 5,12" fill="white" stroke="#e0ddd4" strokeWidth={1.2} />
                <rect x={-6} y={10} width={12} height={4} fill="white" />
                <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={600} fill={color} style={{ fontFamily: 'var(--font-sans)' }}>
                    {label}
                </text>
            </g>
        </motion.g>
    );
}

function MismatchBadge({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
            <g transform={`translate(${x},${y})`}>
                <circle r={16} fill="#fff0f0" stroke="#e85d5d" strokeWidth={1.5} />
                <line x1={-5.5} y1={-5.5} x2={5.5} y2={5.5} stroke="#e85d5d" strokeWidth={2.5} strokeLinecap="round" />
                <line x1={5.5} y1={-5.5} x2={-5.5} y2={5.5} stroke="#e85d5d" strokeWidth={2.5} strokeLinecap="round" />
            </g>
        </motion.g>
    );
}

function MatchBadge({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.3 }}>
            <g transform={`translate(${x},${y})`}>
                <circle r={16} fill="#eefbf2" stroke="#48b06a" strokeWidth={1.5} />
                <path d="M -5 0 L -1 4 L 6 -4" stroke="#48b06a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
        </motion.g>
    );
}

function useParallaxClock(paused: boolean) {
    const elapsed = useMotionValue(0);
    const rafRef = useRef(0);

    useEffect(() => {
        if (paused) return;
        let prev = performance.now();
        const tick = (now: number) => {
            elapsed.set(elapsed.get() + (now - prev) / 1000);
            prev = now;
            rafRef.current = requestAnimationFrame(tick);
        };
        prev = performance.now();
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [paused, elapsed]);

    return {
        cloudX: useTransform(elapsed, t => -((t / 50) % 1) * CLOUD_W),
        birdX:  useTransform(elapsed, t => 100 - ((t / 22) % 1) * 350),
        farX:   useTransform(elapsed, t => -((t / 30) % 1) * FAR_W),
        nearX:  useTransform(elapsed, t => -((t / 18) % 1) * NEAR_W),
    };
}

interface WaitingCardProps {
    preferences: MatchingPreferences;
    elapsedSeconds: number;
    onCancel: () => void;
    isCancelling?: boolean;
    matched?: boolean;
    matchPartnerName?: string;
    onMatchAnimationDone?: () => void;
}

export function WaitingCard({
    preferences, elapsedSeconds, onCancel, isCancelling,
    matched, matchPartnerName, onMatchAnimationDone,
}: WaitingCardProps) {
    const [phase, setPhase] = useState<Phase>('pause');
    const [npcIdx, setNpcIdx] = useState(0);
    const [matchSeqIdx, setMatchSeqIdx] = useState(0);
    const matchTriggered = useRef(false);

    // Normal searching encounter cycle
    useEffect(() => {
        if (matched) return;
        const t = setTimeout(() => {
            const i = SEARCH_SEQ.indexOf(phase);
            if (i === -1) return;
            const next = SEARCH_SEQ[(i + 1) % SEARCH_SEQ.length];
            if (next === 'pause') setNpcIdx(prev => (prev + 1) % NPCS.length);
            setPhase(next);
        }, DURATIONS[phase]);
        return () => clearTimeout(t);
    }, [phase, matched]);

    // When matched becomes true, start the match animation sequence
    useEffect(() => {
        if (!matched || matchTriggered.current) return;
        matchTriggered.current = true;
        setPhase('match_enter');
        setMatchSeqIdx(0);
    }, [matched]);

    // Step through match animation phases
    useEffect(() => {
        if (!matched) return;
        if (!MATCH_SEQ.includes(phase)) return;

        const t = setTimeout(() => {
            const i = MATCH_SEQ.indexOf(phase);
            if (i < MATCH_SEQ.length - 1) {
                setMatchSeqIdx(i + 1);
                setPhase(MATCH_SEQ[i + 1]);
            } else {
                onMatchAnimationDone?.();
            }
        }, DURATIONS[phase]);
        return () => clearTimeout(t);
    }, [phase, matched, matchSeqIdx, onMatchAnimationDone]);

    const isMatchPhase = phase === 'match_enter' || phase === 'match_check' || phase === 'match_celebrate';
    const npc = isMatchPhase ? MATCH_NPC : NPCS[npcIdx];

    const inEncounter = phase === 'meeting' || phase === 'checking' || phase === 'rejecting';
    const scenePaused = inEncounter || isMatchPhase;
    const npcAtMeet = phase === 'approaching' || inEncounter || phase === 'match_check' || phase === 'match_celebrate';
    const showSearchBubbles = phase === 'checking' || phase === 'rejecting';
    const showMatchBubbles = phase === 'match_check' || phase === 'match_celebrate';

    const { cloudX, birdX, farX, nearX } = useParallaxClock(scenePaused);

    const npcTargetX = (() => {
        if (npcAtMeet) return NPC_MEET_X;
        if (phase === 'match_enter') return NPC_MEET_X;
        return NPC_OFF_X;
    })();

    const npcDuration = (() => {
        if (phase === 'approaching' || phase === 'match_enter') return 1.8;
        if (phase === 'leaving') return 1.5;
        return 0.01;
    })();

    const npcEase = (() => {
        if (phase === 'approaching' || phase === 'match_enter') return 'easeOut';
        if (phase === 'leaving') return 'easeIn';
        return 'linear';
    })();

    const userWalking = !inEncounter && !isMatchPhase;
    const npcWalking = phase === 'approaching' || phase === 'leaving' || phase === 'match_enter';
    const npcFacingLeft = phase !== 'leaving';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="w-full h-[calc(100vh-56px)] relative overflow-hidden"
        >
            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMax slice"
            >
                <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d0e4f0" />
                        <stop offset="65%" stopColor="#e4dcd0" />
                        <stop offset="100%" stopColor="#e8dcc8" />
                    </linearGradient>
                </defs>

                <rect width={VB_W} height={GROUND_Y} fill="url(#sky)" />
                <circle cx={VB_W - 130} cy={95} r={50} fill="#faf0c0" opacity={0.3} />
                <circle cx={VB_W - 130} cy={95} r={34} fill="#fcf4d0" opacity={0.45} />

                <motion.g style={{ x: cloudX }}>
                    {[0, 1, 2, 3].map(i => (
                        <g key={i} transform={`translate(${i * CLOUD_W},0)`}>
                            <CloudShape cx={100} cy={90} s={1.1} />
                            <CloudShape cx={340} cy={145} s={0.7} />
                            <CloudShape cx={560} cy={80} s={0.9} />
                        </g>
                    ))}
                </motion.g>

                <motion.g style={{ x: birdX }}>
                    <path d="M0,170 Q4,165 8,170 Q12,165 16,170" stroke="#bbb" strokeWidth={1.2} fill="none" />
                    <path d="M240,142 Q243,138 246,142 Q249,138 252,142" stroke="#ccc" strokeWidth={1} fill="none" />
                    <path d="M460,158 Q463,154 466,158 Q469,154 472,158" stroke="#ccc" strokeWidth={1} fill="none" />
                </motion.g>

                <motion.g style={{ x: farX }}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <g key={i} transform={`translate(${i * FAR_W},0)`}><FarTile /></g>
                    ))}
                </motion.g>

                <motion.g style={{ x: nearX }}>
                    {[0, 1, 2, 3, 4].map(i => (
                        <g key={i} transform={`translate(${i * NEAR_W},0)`}><NearTile /></g>
                    ))}
                </motion.g>

                <rect y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill="#b8d4a8" />
                <rect y={PATH_Y} width={VB_W} height={PATH_H} fill="#e8dcc8" />
                <line x1={0} y1={PATH_Y + 1} x2={VB_W} y2={PATH_Y + 1} stroke="#ded2be" strokeWidth={0.5} />
                <line x1={0} y1={PATH_Y + PATH_H - 1} x2={VB_W} y2={PATH_Y + PATH_H - 1} stroke="#ded2be" strokeWidth={0.5} />

                {[80, 260, 480, 700, 920, 1140, 1340].map(gx => (
                    <path key={gx} d={`M${gx},${GROUND_Y + 8} Q${gx + 5},${GROUND_Y + 1} ${gx + 10},${GROUND_Y + 8}`}
                        stroke="#8dc48d" strokeWidth={1.2} fill="none" opacity={0.45} />
                ))}

                <g transform={`translate(${USER_X},${PATH_Y})`}>
                    <Char
                        bodyColor="var(--accent)"
                        hairColor="#3B2614"
                        walking={userWalking}
                        celebrate={phase === 'match_celebrate'}
                    />
                </g>

                <motion.g
                    animate={{ x: npcTargetX }}
                    transition={{ duration: npcDuration, ease: npcEase }}
                >
                    <g transform={`translate(0,${PATH_Y})`}>
                        <Char
                            bodyColor={npc.body}
                            hairColor={npc.hair}
                            hasHat={npc.hat}
                            facingLeft={npcFacingLeft}
                            walking={npcWalking}
                            headShake={phase === 'rejecting'}
                            celebrate={phase === 'match_celebrate'}
                        />
                    </g>
                </motion.g>

                {showSearchBubbles && (
                    <>
                        <Bubble x={USER_X} y={PATH_Y - 88} label={preferences.topic} color="var(--accent)" delay={0.15} />
                        <Bubble x={NPC_MEET_X} y={PATH_Y - 88} label="Nope" color={npc.body} delay={0.4} />
                    </>
                )}

                {showMatchBubbles && (
                    <>
                        <Bubble x={USER_X} y={PATH_Y - 88} label={preferences.topic} color="var(--accent)" delay={0.1} />
                        <Bubble x={NPC_MEET_X} y={PATH_Y - 88} label={preferences.topic} color={npc.body} delay={0.35} />
                    </>
                )}

                {phase === 'rejecting' && (
                    <MismatchBadge x={(USER_X + NPC_MEET_X) / 2} y={PATH_Y - 42} />
                )}

                {(phase === 'match_check' || phase === 'match_celebrate') && (
                    <MatchBadge x={(USER_X + NPC_MEET_X) / 2} y={PATH_Y - 42} />
                )}
            </svg>

            <div
                className="absolute bottom-0 inset-x-0 h-[320px] pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, var(--background) 0%, color-mix(in oklch, var(--background) 90%, transparent) 45%, transparent 100%)',
                }}
            />

            <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-3 pb-10 pointer-events-none">
                <h1
                    className="text-[22px] font-bold text-foreground tracking-tight"
                    style={{ fontFamily: 'var(--font-serif)' }}
                >
                    {phase === 'match_celebrate' ? 'Match found!' : 'Searching for a peer'}
                </h1>

                {phase === 'match_celebrate' && matchPartnerName && (
                    <p className="text-[12.5px] text-muted-foreground">
                        You&apos;ve been paired with{' '}
                        <span className="font-semibold text-foreground">{matchPartnerName}</span>
                    </p>
                )}

                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-accent text-[11.5px] font-semibold border border-border/50">
                        {preferences.topic}
                    </span>
                    <span className="text-muted-foreground/30 text-[10px] select-none">&middot;</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-accent text-[11.5px] font-semibold border border-border/50">
                        {preferences.difficulty}
                    </span>
                    <span className="text-muted-foreground/30 text-[10px] select-none">&middot;</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-accent text-[11.5px] font-semibold border border-border/50">
                        {PROGRAMMING_LANGUAGE_LABELS[preferences.language]}
                    </span>
                </div>

                {!isMatchPhase && (
                    <>
                        <div className="flex items-center gap-2 mt-1">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" className="text-muted-foreground/50">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[13px] text-muted-foreground font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                                {formatTime(elapsedSeconds)}
                            </span>
                        </div>
                        <Button
                            onClick={onCancel}
                            disabled={isCancelling}
                            variant="ghost"
                            className="text-[12.5px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg px-5 transition-all duration-150 active:scale-[0.97] cursor-pointer pointer-events-auto mt-1"
                        >
                            {isCancelling ? 'Cancelling\u2026' : 'Cancel'}
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );
}
