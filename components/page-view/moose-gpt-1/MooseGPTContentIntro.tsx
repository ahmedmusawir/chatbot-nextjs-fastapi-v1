import Head from "next/head";
import React, { useState } from "react";
import { Page } from "../../globals";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Spinner from "@/components/ui-ux/common/Spinner";
import ChatMessage from "@/components/ui-ux/moose-gpt-1/ChatMessage";
import UserInputBottom from "@/components/ui-ux/moose-gpt-1/UserInputBottom";

interface Message {
  isUser: boolean;
  text: string;
}

const MooseGPTContentIntro = () => {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChatSubmit = async (userInput: string) => {
    setIsLoading(true);

    setChatMessages((prevMessages) => [
      ...prevMessages,
      { isUser: true, text: userInput },
      { isUser: false, text: "" },
    ]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: userInput }),
    });

    if (!response.body) {
      setIsLoading(false);
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponse = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        chunk.split("\n").forEach((line) => {
          if (line.trim().startsWith("data:")) {
            const dataString = line.replace("data:", "").trim();
            try {
              const data = JSON.parse(dataString);
              if (data.response) {
                aiResponse += data.response;
                setChatMessages((prevMessages) => {
                  const lastMessage = prevMessages[prevMessages.length - 1];
                  if (!lastMessage.isUser) {
                    return [
                      ...prevMessages.slice(0, -1),
                      { isUser: false, text: aiResponse },
                    ];
                  } else {
                    return [
                      ...prevMessages,
                      { isUser: false, text: aiResponse },
                    ];
                  }
                });
              }
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMessage = () => {
    setChatMessages([]);
  };

  return (
    <>
      <Head>
        <title>LANGSERVE GPTs</title>
        <meta name="description" content="This is the demo page" />
      </Head>
      <Page className={""} FULL={true} customYMargin="my-0">
        <div className="flex">
          <div className="hidden sm:block w-64 bg-gray-300 p-4">
            <button className="btn" onClick={handleClearMessage}>
              Clear Messages
            </button>
          </div>
          <div className="flex-1 bg-gray-200 p-4">
            <section className="flex flex-col h-[90vh]">
              <div className="flex items-center h-14">
                <ArrowLeftIcon className="mr-2 h-6 w-6 text-gray-600" />
                <h1 className="text-xl font-bold">FASTAPI FOR YOUTUBE v1</h1>
              </div>
              <div className="overflow-y-auto flex-1 bg-gray-100">
                <article className="flex justify-center p-5 mb-24 w-[100%]">
                  <section className="w-[80%]">
                    {chatMessages.map((msg, index) => (
                      <ChatMessage
                        key={index}
                        isUser={msg.isUser}
                        message={msg.text}
                      />
                    ))}
                    {isLoading && <Spinner />}
                  </section>
                </article>
              </div>
              <div className="bg-gray-200 h-21 flex justify-center items-center">
                <UserInputBottom onSubmit={handleChatSubmit} />
              </div>
            </section>
          </div>
        </div>
      </Page>
    </>
  );
};

export default MooseGPTContentIntro;
