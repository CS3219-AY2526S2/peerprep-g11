import mongoose, { Document, Schema } from "mongoose";

const PROGRAMMING_LANGUAGES = ["python", "java", "javascript"] as const;
type ProgrammingLanguage = (typeof PROGRAMMING_LANGUAGES)[number];

// mirrors SessionParticipant in frontend/app/sessions/[sessionId]/types.ts
// note: isCurrentUser is NOT stored in DB — it is computed per-request
//       based on which userId is calling the endpoint
export interface IParticipant {
  id: string; // MongoDB _id of the user from user-service
  username: string;
}

export interface ISession extends Document {
  sessionId: string; // same as matchId from matching service
  questionId: string; // references a question in question-service
  status: "active" | "ended";
  selectedLanguage: ProgrammingLanguage;
  allowedLanguages: ProgrammingLanguage[];
  participants: IParticipant[]; // exactly two users
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>(
  {
    id: { type: String, required: true },
    username: { type: String, required: true },
  },
  { _id: false }, // participants are embedded — no separate _id needed
);

const sessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    questionId: { type: String, required: true },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    selectedLanguage: {
      type: String,
      enum: PROGRAMMING_LANGUAGES,
      required: true,
    },
    allowedLanguages: {
      type: [String],
      enum: PROGRAMMING_LANGUAGES,
      default: [...PROGRAMMING_LANGUAGES],
    },
    participants: {
      type: [participantSchema],
      required: true,
      validate: {
        validator: (v: IParticipant[]) => v.length === 2,
        message: "A session must have exactly two participants",
      },
    },
  },
  { timestamps: true }, // adds createdAt and updatedAt automatically
);

export const Session = mongoose.model<ISession>("Session", sessionSchema);
