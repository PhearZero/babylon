import {HfInference} from '@huggingface/inference';
import {clearAsyncInterval, setAsyncInterval} from './process.js';
import {config} from './config.js';

const HF_ACCESS_TOKEN =process.env.HF_ACCESS_TOKEN;

export const inference = new HfInference(HF_ACCESS_TOKEN);

/**
 * Generate Random Text
 *
 * @param {string} prompt GPT Prompt
 * @return {Promise<string>}
 */
export async function textGeneration(prompt=config.htmx.prompt) {
  console.log('ai: textGeneration()');
  const result= await inference.textGeneration({
    model: 'gpt2',
    inputs: prompt,
    parameters: {
      return_full_text: false,
    },
  }, {
    use_cache: typeof HF_ACCESS_TOKEN === 'undefined',
  }).catch((e)=>{
    return {generated_text: `Hugging Face - ${e.message}`};
  });
  const response = result.generated_text.split(/[.:\n\r(!]/g);
  return response[0];
}

/**
 * Talk to GPT
 *
 * @param {string} prompt GPT Prompt
 * @param {function} callback message callback
 * @param {number} [interval] delay between messages
 * @return {(function(): void)|*}
 */
export function talk(prompt=config.htmx.prompt, callback, interval=30000) {
  console.log('ai: talk()');
  const int = setAsyncInterval(async ()=>{
    const text = await textGeneration(prompt);
    callback(text);
  }, interval);

  return ()=>{
    clearAsyncInterval(int);
  };
}
