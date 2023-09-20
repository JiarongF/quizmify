'use client';

import {Game, Question} from "@prisma/client";
import { differenceInSeconds } from "date-fns";
import React from "react";
import { useToast } from "./ui/use-toast";
import { z } from "zod";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { checkAnswerSchema } from "@/schemas/form/quiz";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight, Loader2, Timer } from "lucide-react";
import BlackAnswerInput from "./BlankAnswerInput";
import { formatTimeDelta } from "@/lib/utils";

type Props = {
    game: Game & { questions: Pick<Question, "id" | "question" | "answer">};
};

const OpenEnded = ({game} : Props) => {
    const [questionIndex, setQuestionIndex] = React.useState(0);
    const [blankAnswer, setBlankAnswer] = React.useState<string>("");
    const [hasEnded, setHasEnded] =  React.useState<boolean>(false);
    const [now, setNow] = React.useState<Date>(new Date());
    const {toast} = useToast();
    const currentQuestion = React.useMemo(() => {
        return game.questions[questionIndex];
    }, [questionIndex, game.questions]);
    React.useEffect(() => {
        const interval = setInterval(() => {
          if (!hasEnded) {
            setNow(new Date());
          }
        }, 1000);
        return () => clearInterval(interval);
      }, [hasEnded]);
      
    const {mutate: checkAnswer, isLoading: isChecking} = useMutation({
        mutationFn:async () => {
            let filledAnswer = blankAnswer;
            document.querySelectorAll("#user-blank-input").forEach((input) => {
                filledAnswer = filledAnswer.replace("_____", input.value);
                input.value = "";
              });
            const payload: z.infer<typeof checkAnswerSchema> = {
                questionId: currentQuestion.id,
                userAnswer: filledAnswer,
            };
            const response = await axios.post("api/checkAnswer", payload);
            return response.data;
        },
    });

    const handleNext = React.useCallback(() => {
        if (isChecking) return;
        checkAnswer(undefined, {
            onSuccess : ({ percentageSimilar }) => {
                toast({
                    title : `Your answer is ${percentageSimilar}% similar to the correct answer.`,
                    description : "answers are matched based on similarity comparisions"
                })
                if (questionIndex === game.questions.length - 1) {
                    setHasEnded(true);
                    return;
                }
                setQuestionIndex((prev) => prev + 1);
            },
        });
    }, [checkAnswer, toast, isChecking, questionIndex, game.questions.length, blankAnswer]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                handleNext();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown",handleKeyDown);
        };
    }, [handleNext]);

    return (
        <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] top-1/2 left-1/2">
            <div className="flex flex-row justify-between">
                <div className="flex flex-col">
                <p>
                    <span className="mr-2 text-slate-400">Topic</span>
                    <span className="px-2 py-1 text-white rounded-lg bg-slate-800">{game.topic}</span>
                </p>
                <div className="flex self-start mt-3 text-slate-400">
                    <Timer className = "mr-2" />
                    {formatTimeDelta(differenceInSeconds(now, game.timeStarted))}
                </div>
                </div>
            </div>
            <Card className = "w-full mt-4">
                <CardHeader className="flex flex-row items-center">
                    <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
                        <div>{questionIndex + 1}</div>
                        <div className="text-base text-slate-400">
                            {game.questions.length}
                        </div>
                    </CardTitle>
                    <CardDescription className="flex-grow text-lg">
                        {currentQuestion?.question}
                    </CardDescription>
                </CardHeader>
            </Card>
            <div className="flex flex-col items-center justify-center w-full mt-4">
                <BlackAnswerInput answer = {currentQuestion.answer} setBlankAnswer={setBlankAnswer} />
                <Button className="mt-2" disabled = {isChecking} onClick={() => {
                    handleNext();
                }}>
                    {isChecking && <Loader2 className="w-4 h-4 mr-2 animated-spin"/>}
                    Next <ChevronRight className="w-4 h-4 ml-2"/>
                </Button>
            </div>
        </div>
    )
};

export default OpenEnded;