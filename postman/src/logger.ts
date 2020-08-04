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

import {createLogger, format, transports} from 'winston'

import path = require('path');

const logCombined = path.join(__dirname, 'logs', 'errors.log')
const logError = path.join(__dirname, 'logs', 'combined.log')
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({stack: true}),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.File({filename: logError, level: 'error'}),
    new transports.File({filename: logCombined}),
  ],
})

export default logger
