-- CreateTable
CREATE TABLE "student_sequences" (
    "institutionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "currentSequence" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "student_sequences_pkey" PRIMARY KEY ("institutionId","sessionId")
);
