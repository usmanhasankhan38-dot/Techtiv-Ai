/* Technology inventory — the 29 entries and categories are taken from the live
   TechtivAI Technology section (verified 20 Nov 2026). Version numbers shown on
   the live site (GPT-4o, Claude 3.5, …) are dropped in favour of the brand name.

   Logo sources
   - simple-icons v16 (CC0-1.0, https://simpleicons.org): MLflow, FastAPI, Next.js, React, Node.js, Python
   - @lobehub/icons-static-svg v1.104 (MIT, https://github.com/lobehub/lobe-icons): all other logos
   - Text treatment (no maintained official SVG available in the sources above):
     AutoGen, Pinecone, Weaviate, GoHighLevel, Vapi
   Brand names and logos are trademarks of their owners. */

import openai from '../../assets/logos/openai.svg'
import claude from '../../assets/logos/claude.svg'
import gemini from '../../assets/logos/gemini.svg'
import llama from '../../assets/logos/llama.svg'
import langchain from '../../assets/logos/langchain.svg'
import langgraph from '../../assets/logos/langgraph.svg'
import crewai from '../../assets/logos/crewai.svg'
import llamaindex from '../../assets/logos/llamaindex.svg'
import n8n from '../../assets/logos/n8n.svg'
import make from '../../assets/logos/make.svg'
import zapier from '../../assets/logos/zapier.svg'
import bedrock from '../../assets/logos/bedrock.svg'
import azure from '../../assets/logos/azure.svg'
import googlecloud from '../../assets/logos/googlecloud.svg'
import huggingface from '../../assets/logos/huggingface.svg'
import whisper from '../../assets/logos/whisper.svg'
import elevenlabs from '../../assets/logos/elevenlabs.svg'
import clip from '../../assets/logos/clip.svg'
import mlflow from '../../assets/logos/mlflow.svg'
import fastapi from '../../assets/logos/fastapi.svg'
import nextjs from '../../assets/logos/nextjs.svg'
import react from '../../assets/logos/react.svg'
import nodejs from '../../assets/logos/nodejs.svg'
import python from '../../assets/logos/python.svg'

export type Category = 'AI Models' | 'AI Agents' | 'Automation' | 'Data & Cloud' | 'Voice AI' | 'Development'

export type Tech = {
  id: string
  name: string
  /** short, accurate descriptor (3–5 words) */
  desc: string
  /** the tag the live site shows under the name */
  tag: string
  category: Category
  logo: string | null
  /** short text shown when no official logo is available */
  mark?: string
  maker?: string
}

export const CATEGORIES: Category[] = ['AI Models', 'AI Agents', 'Automation', 'Data & Cloud', 'Voice AI', 'Development']

export const TECH: Tech[] = [
  { id: 'openai', name: 'OpenAI', desc: 'Advanced AI language models', tag: 'Foundation LLM', category: 'AI Models', logo: openai },
  { id: 'claude', name: 'Claude', desc: "Anthropic's AI model family", tag: 'Reasoning AI', category: 'AI Models', logo: claude },
  { id: 'gemini', name: 'Gemini', desc: "Google's multimodal AI models", tag: 'Multimodal', category: 'AI Models', logo: gemini },
  { id: 'llama', name: 'Llama', desc: "Meta's open-weight language models", tag: 'Open Source LLM', category: 'AI Models', logo: llama, maker: 'Meta logo' },
  { id: 'langchain', name: 'LangChain', desc: 'LLM application framework', tag: 'LLM Framework', category: 'AI Models', logo: langchain },
  { id: 'langgraph', name: 'LangGraph', desc: 'Stateful agent orchestration framework', tag: 'Agent Orchestration', category: 'AI Agents', logo: langgraph },
  { id: 'crewai', name: 'CrewAI', desc: 'Multi-agent collaboration framework', tag: 'Multi-Agent', category: 'AI Agents', logo: crewai },
  { id: 'autogen', name: 'AutoGen', desc: "Microsoft's multi-agent framework", tag: 'Agent Framework', category: 'AI Agents', logo: null, mark: 'AutoGen' },
  { id: 'llamaindex', name: 'LlamaIndex', desc: 'Data framework for RAG', tag: 'RAG Engine', category: 'Data & Cloud', logo: llamaindex },
  { id: 'pinecone', name: 'Pinecone', desc: 'Managed vector database', tag: 'Vector DB', category: 'Data & Cloud', logo: null, mark: 'Pinecone' },
  { id: 'weaviate', name: 'Weaviate', desc: 'Open-source vector database', tag: 'Vector Search', category: 'Data & Cloud', logo: null, mark: 'Weaviate' },
  { id: 'n8n', name: 'n8n', desc: 'Flexible workflow automation platform', tag: 'Workflow Engine', category: 'Automation', logo: n8n },
  { id: 'make', name: 'Make', desc: 'Visual workflow automation platform', tag: 'Automation', category: 'Automation', logo: make },
  { id: 'zapier', name: 'Zapier', desc: 'No-code app automation', tag: 'Automation', category: 'Automation', logo: zapier },
  { id: 'ghl', name: 'GoHighLevel', desc: 'CRM and marketing automation', tag: 'CRM Automation', category: 'Automation', logo: null, mark: 'GHL' },
  { id: 'bedrock', name: 'AWS Bedrock', desc: 'Managed foundation model service', tag: 'Cloud AI', category: 'Data & Cloud', logo: bedrock },
  { id: 'azure', name: 'Azure OpenAI', desc: 'OpenAI models on Azure', tag: 'Enterprise AI', category: 'Data & Cloud', logo: azure, maker: 'Azure logo' },
  { id: 'googlecloud', name: 'Google Cloud', desc: 'Cloud computing and AI', tag: 'Cloud AI', category: 'Data & Cloud', logo: googlecloud },
  { id: 'huggingface', name: 'Hugging Face', desc: 'Open model and dataset hub', tag: 'Model Hub', category: 'AI Models', logo: huggingface },
  { id: 'whisper', name: 'Whisper', desc: "OpenAI's speech recognition model", tag: 'Speech AI', category: 'Voice AI', logo: whisper, maker: 'OpenAI logo' },
  { id: 'elevenlabs', name: 'ElevenLabs', desc: 'AI voice generation', tag: 'Voice AI', category: 'Voice AI', logo: elevenlabs },
  { id: 'vapi', name: 'Vapi', desc: 'Voice AI agent platform', tag: 'Voice Agents', category: 'Voice AI', logo: null, mark: 'Vapi' },
  { id: 'clip', name: 'CLIP', desc: "OpenAI's image–text model", tag: 'Vision AI', category: 'Voice AI', logo: clip, maker: 'OpenAI logo' },
  { id: 'mlflow', name: 'MLflow', desc: 'ML lifecycle management platform', tag: 'MLOps', category: 'Development', logo: mlflow },
  { id: 'fastapi', name: 'FastAPI', desc: 'High-performance Python API framework', tag: 'AI API Backend', category: 'Development', logo: fastapi },
  { id: 'nextjs', name: 'Next.js', desc: 'React framework for the web', tag: 'Web Framework', category: 'Development', logo: nextjs },
  { id: 'react', name: 'React', desc: 'Interactive user interface library', tag: 'UI Library', category: 'Development', logo: react },
  { id: 'nodejs', name: 'Node.js', desc: 'JavaScript server runtime', tag: 'Runtime', category: 'Development', logo: nodejs },
  { id: 'python', name: 'Python', desc: 'General-purpose programming language', tag: 'AI Language', category: 'Development', logo: python },
]

const byId = (ids: string[]) => ids.map((id) => TECH.find((t) => t.id === id)!)

/* Upper stream: models, agents and data. Lower stream: automation, cloud, voice and build stack. */
export const ROW_TOP = byId(['openai', 'claude', 'gemini', 'llama', 'langchain', 'langgraph', 'crewai', 'autogen', 'llamaindex', 'pinecone', 'weaviate', 'huggingface', 'clip', 'mlflow'])
export const ROW_BOTTOM = byId(['n8n', 'make', 'zapier', 'ghl', 'bedrock', 'azure', 'googlecloud', 'whisper', 'elevenlabs', 'vapi', 'fastapi', 'nextjs', 'react', 'nodejs', 'python'])
