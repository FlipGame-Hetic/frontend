import type { FC } from "react";
import { formatScore } from "@flipper/utils";

interface ScoreDisplayProps {
  score: number;
  label: string;
}

export const ScoreDisplay: FC<ScoreDisplayProps> = ({ score, label }) => (
  <div className="font-display flex flex-col items-center">
    <span className="text-neon-cyan text-xs tracking-widest uppercase">{label}</span>
    <span className="text-4xl text-white tabular-nums">{formatScore(score)}</span>
  </div>
);
