import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';
import { createTools } from './tools.js';
import { modelMapping } from './utils/models.js';
import { ChatAnthropic } from '@langchain/anthropic';
import { SystemMessage } from '@langchain/core/messages';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

const systemMessage = new SystemMessage(
  ` You are an AI agent on Duck network capable of executing all kinds of transactions and interacting with the Duck blockchain.
    You are able to execute transactions on behalf of the user.

    If the transaction was successful, return the response in the following format:
    The transaction was successful. The transaction hash is: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
  
    If the transaction was unsuccessful, return the response in the following format, followed by an explanation if any known:
    The transaction failed.
  `,
);

export const prompt = ChatPromptTemplate.fromMessages([
  systemMessage,
  ['placeholder', '{chat_history}'],
  ['human', '{input}'],
  ['placeholder', '{agent_scratchpad}'],
]);

export const createAgent = (
  duckAgent: { getCredentials: () => { privateKey: string } },
  modelName: keyof typeof modelMapping,
  openAiApiKey?: string,
  anthropicApiKey?: string,
) => {
  const model = () => {
    if (modelMapping[modelName] === 'openai') {
      if (!openAiApiKey) {
        throw new Error('OpenAI API key is required');
      }
      return new ChatOpenAI({
        modelName: modelName,
        apiKey: openAiApiKey,
      });
    }
    if (modelMapping[modelName] === 'anthropic') {
      if (!anthropicApiKey) {
        throw new Error('Anthropic API key is required');
      }
      return new ChatAnthropic({
        modelName: modelName,
        anthropicApiKey: anthropicApiKey,
      });
    }
  };

  const selectedModel = model();

  if (!selectedModel) {
    throw new Error('Error initializing model');
  }

  const tools = createTools(duckAgent);

  const agent = createToolCallingAgent({
    llm: selectedModel,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
  });

  // Wrap executor with per-session message history
  // Maintain a per-session message history map
  const histories = new Map<string, InMemoryChatMessageHistory>();
  const agentWithHistory = new RunnableWithMessageHistory({
    runnable: executor,
    getMessageHistory: (sessionId: string) => {
      let history = histories.get(sessionId);
      if (!history) {
        history = new InMemoryChatMessageHistory();
        histories.set(sessionId, history);
      }
      return history;
    },
    inputMessagesKey: 'input',
    historyMessagesKey: 'chat_history',
    outputMessagesKey: 'output',
  });

  return agentWithHistory;
};