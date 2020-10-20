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

import {
  Credentials,
  deployProject,
  Flags,
  OWOptions,
  Persister,
} from 'nimbella-deployer'
import logger from './logger'

export default class Deployer {
  creds: Credentials;

  options: OWOptions;

  persister: Persister;

  flags: Flags;

  constructor(
    creds: Credentials,
    options: OWOptions,
    persister: Persister,
    flags: Flags,
  ) {
    this.creds = creds
    this.options = options
    this.persister = persister
    this.flags = flags
  }

  deploy = async (projectPath: string): Promise<boolean> => {
    try {
      await deployProject(
        projectPath,
        this.options,
        this.creds,
        this.persister,
        this.flags,
      )
      return true
    } catch (error) {
      logger.error(error)
      console.log("Couldn't deploy")
      return false
    }
  };
}
