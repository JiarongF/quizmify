import QuizCreation from "@/components/QuizCreation";
import { getAuthSession } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import React from "react";

export const metadata = {
  title: "Quiz | Quizmify",
  description: "Quiz yourself on anything!",
};

type Props = [];

const Quiz = async (props: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect('/');
  }
  return <QuizCreation/>;
};

export default Quiz;