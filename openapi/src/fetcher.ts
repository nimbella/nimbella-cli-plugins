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

import axios, {AxiosInstance} from 'axios'
import * as rax from 'retry-axios'
import logger from './logger'

export default class SwaggerHubFetcher {
  baseUrl = 'https://api.swaggerhub.com/';

  apiKey: string | undefined;

  instance: AxiosInstance;

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey
    rax.attach()
    this.instance = axios.create({
      baseURL: this.baseUrl,
      headers: {Authorization: this.apiKey},
    })
    rax.attach(this.instance)
  }

  getAllSpecs = async (ownerName: string): Promise<Array<any>> => {
    let output: Array<any> = []
    try {
      const url = `${this.baseUrl}apis/${ownerName}?page=0&limit=50&sort=NAME&order=ASC`
      output = (await this.instance.get(url)).data.apis
    } catch (error) {
      logger.error(error)
    }
    return output
  };

  getSpec = async (
    ownerName: string,
    specName: string,
    version: string,
  ): Promise<object> => {
    let output: object
    try {
      const url = `${
        this.baseUrl
      }apis/${ownerName}/${specName.toLowerCase()}/${version}`
      output = await this.instance.get(url)
    } catch (error) {
      const msg = `Could not fetch the spec '${specName}' from server! Please check if it exists.`
      console.warn(msg)
      logger.warn(error)
      throw new Error(msg)
    }
    return output
  };

  getSpecName = async (
    ownerName: string,
    specName: string,
  ): Promise<string> => {
    try {
      const specs = await this.getAllSpecs(ownerName)
      return specs.find(
        item => item.name.toUpperCase() === specName.toUpperCase(),
      ).name
    } catch (error) {
      const msg = `Could not fetch the spec ${specName} from server! Please check if it exists.`
      console.warn(msg)
      logger.warn(error)
      throw new Error(msg)
    }
  };

  getOAS = async (
    ownerName: string,
    specName: string,
    specVersion: string,
  ): Promise<any> => {
    try {
      const spec: any = await this.getSpec(ownerName, specName, specVersion)
      return {
        version: spec.data.openapi || '',
        spec: spec.data,
      }
    } catch (error) {
      console.log(`Error getting spec ${specName} from the SwaggerHub`)
    }
  };

  async getSpecVersions(owner: string | undefined) {
    const specVersions: string[] = []
    const specs = await this.getAllSpecs(owner || '')
    specs.forEach(e => {
      const id = e.properties
      .filter((p: any) => {
        return p.type === 'Swagger'
      })[0]
      .url.split('/')
      .slice(-2, -1)[0]
      const versions = e.properties.filter((p: any) => {
        return p.type === 'X-Versions'
      })
      if (versions.length > 0) {
        versions[0].value.split(',').forEach((p: any) => {
          specVersions.push(`${e.name} (${id} - ${p})`)
        })
      } else {
        const version = e.properties.filter((p: any) => {
          return p.type === 'X-Version'
        })[0]
        specVersions.push(`${e.name} (${id} - ${version.value})`)
      }
    })
    return specVersions
  }

  getUser = async (): Promise<string> => {
    let output = ''
    try {
      output = (await this.instance.get(`${this.baseUrl}me/`)).data
    } catch (error) {
      logger.error(error)
    }
    return output
  };
}
