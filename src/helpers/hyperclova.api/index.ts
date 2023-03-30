/** 
 * simple wrapper for hyperclova x 
 * for a coherent interface with openai api
 */

import type { Configuration } from './configuration';
import type {
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from 'openai/api'
import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
import type { RequestArgs } from './base';
import { DUMMY_BASE_URL, assertParamExists, serializeDataIfNeeded, toPathString, createRequestFunction, setSearchParams } from './common';

const BASE_PATH = 'http://playground.nap.svc.ad1.io.navercorp.com'

const collectTextFromMessage = (messages: {role: string, content: string}[]) => {
  return messages.map(item => item.content).concat(["<Thought>"]).join("\n")
}

export const HyperCLOVAApiAxiosParamCreator = function (configuration?: Configuration) {
  return {
      createChatCompletion: async (createChatCompletionRequest: CreateChatCompletionRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
          // verify required parameter 'createChatCompletionRequest' is not null or undefined
          assertParamExists('createChatCompletion', 'createChatCompletionRequest', createChatCompletionRequest)
          const localVarPath = `/api/completions`;
          // use dummy base URL string because the URL constructor only accepts absolute URLs.
          const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
          let baseOptions;
          if (configuration) {
              baseOptions = configuration.baseOptions;
          }

          const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
          const localVarHeaderParameter = {} as any;
          const localVarQueryParameter = {} as any;

          localVarHeaderParameter['Content-Type'] = 'application/json';

          setSearchParams(localVarUrlObj, localVarQueryParameter);
          let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
          localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
          // request data swap
          // message merging... -> simple merge 
          let text = collectTextFromMessage(createChatCompletionRequest.messages)
          console.log('text', text)
          const hcCompletionRequest = {
            text,
            playground_tracker: {
              user_deptnm: "Dialog Service",
              user_id: "KR20231",
              user_language: "ko_KR",
              user_name: "조찬송"
            },
            model: createChatCompletionRequest.model,
            max_tokens: createChatCompletionRequest.max_tokens,
            temperature: createChatCompletionRequest.temperature,
            stop_before: createChatCompletionRequest.stop,
            top_k: 0,
            top_p: 0.8,
            repetition_penalty: 5
          }

          localVarRequestOptions.data = serializeDataIfNeeded(hcCompletionRequest, localVarRequestOptions, configuration)

          return {
              url: toPathString(localVarUrlObj),
              options: localVarRequestOptions,
          };
      }
  }
};

export interface HCCompletionsResponse {
  "text": string,
  "stop_reason": string
  "start_length": number;
  "input_length": number;
  "output_length": number;
  "semantic_score": number;
  "ok": boolean;
  "latency": number
}

export const HyperCLOVAApiiFp = (configuration?: Configuration) => {
  const localVarAxiosParamCreator = HyperCLOVAApiAxiosParamCreator(configuration)
  return {
    async createChatCompletion(createChatCompletionRequest: CreateChatCompletionRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<HCCompletionsResponse>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.createChatCompletion(createChatCompletionRequest, options);
      return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
    },
  }
}


export class HyperCLOVAApi {
  protected configuration: Configuration | undefined;

  constructor(configuration?: Configuration, protected basePath: string = BASE_PATH, protected axios: AxiosInstance = globalAxios) {
    if (configuration) {
        this.configuration = configuration;
        this.basePath = configuration.basePath || this.basePath;
    }
  }

  public async createChatCompletion(createChatCompletionRequest: CreateChatCompletionRequest, options?: AxiosRequestConfig) {
    const text = collectTextFromMessage(createChatCompletionRequest.messages)
    return HyperCLOVAApiiFp(this.configuration).createChatCompletion(createChatCompletionRequest, options)
      .then((request) => request(this.axios, this.basePath))
      .then((resp) => ({
        ...resp,
        data: {
          id: "dummy",
          object: '',
          created: 0,  
          usage: {
            prompt_tokens: resp.data.input_length,
            completion_tokens: resp.data.output_length,
            total_tokens: resp.data.input_length + resp.data.output_length,
          },
          choices: [
            {message: {role: 'system', content: "<Thought>".concat(resp.data.text.slice(text.length))}}
          ],
          model: createChatCompletionRequest.model,

        } as CreateChatCompletionResponse
      })
    )
  }
}