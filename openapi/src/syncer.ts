/*
 * Copyright (c) 2019 - present Nimbella Corp.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import axios from 'axios'
import * as rax from 'retry-axios'
import {green} from 'chalk'
import logger from './logger'

export default class SwaggerHubSyncer {
  baseUrl = 'https://api.swaggerhub.com/';

  apiKey: string;

  instance: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.instance = axios.create({
      baseURL: this.baseUrl,
      headers: {'X-Api-Key': this.apiKey, 'Content-Type': 'application/json'},
    })
    rax.attach(this.instance)
  }

  createSpec = async (collectionData: string): Promise<string> => {
    let output = ''
    try {
      output = await (
        await this.instance.post(`${this.baseUrl}collections`, collectionData)
      ).data
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't create collection at: ${this.baseUrl}`)
    }
    return output
  };

  updateSpec = async (
    collectionId: string,
    collectionData: object,
  ): Promise<string> => {
    let output: any
    try {
      output = await (
        await this.instance.put(
          `${this.baseUrl}collections/${collectionId}`,
          collectionData,
        )
      ).data
      console.log(
        `the updated collection ${green(
          output.collection.name,
        )} has been synced back to swaggerhub`,
      )
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't update collection at: ${this.baseUrl}`)
    }
    return output
  };

  deleteSpec = async (collectionId: string): Promise<string> => {
    let output = ''
    try {
      output = await (
        await this.instance.delete(`${this.baseUrl}collections/${collectionId}`)
      ).data
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't delete collection from: ${this.baseUrl}`)
    }
    return output
  };

  forkSpec = async (
    collectionId: string,
    workspaceId: string,
  ): Promise<string> => {
    let output = ''
    try {
      output = await (
        await this.instance.post(
          `${this.baseUrl}collections/fork/${collectionId}?workspace=${workspaceId}`,
        )
      ).data
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't from collection from: ${this.baseUrl}`)
    }
    return output
  };

  mergeSpec = async (
    sourceSpecId: string,
    destinationSpecId: string,
  ): Promise<string> => {
    let output = ''
    const payload: object = {
      strategy: 'deleteSource',
      source: sourceSpecId,
      destination: destinationSpecId,
    }
    try {
      output = await (
        await this.instance.post(
          `${this.baseUrl}collections/merge`,
          JSON.stringify(payload),
        )
      ).data
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't merge collection at: ${this.baseUrl}`)
    }
    return output
  };
}
