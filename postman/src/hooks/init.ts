import * as Config from '@oclif/config'
import {CLIError} from '@oclif/errors'

import CommandTree from '../tree'

export const init: Config.Hook<'init'> = async function (ctx) {
  // build tree
  const cmds = ctx.config.commandIDs
  const tree = new CommandTree()
  cmds.forEach(c => {
    const bits = c.split(':')
    let cur = tree
    bits.forEach(b => {
      cur = cur.findOrInsert(b) as CommandTree
    })
  })

  const id: string[] =
    (typeof ctx.id === 'string' ? [ctx.id] : (ctx.id! as any)) || []
  const RAWARGV = id.concat(ctx.argv || [])

  const convertName = function (id: string[]): string {
    return id.join(':')
  }

  const convertArgv = function (id: string, old = process.argv) {
    const keys = id.split(':')
    const argv = old.slice(keys.length + 2, old.length)
    return argv
  }

  // overwrite config.findCommand
  const findCommand = ctx.config.findCommand
  function spacesFindCommand(
    _: string,
    __: { must: true }
  ): Config.Command.Plugin;
  function spacesFindCommand(
    _: string,
    __: { must: true },
  ): Config.Command.Plugin | undefined {
    const [node, c] = tree.findMostProgressiveCmd(RAWARGV)
    if (node) {
      if (Object.keys((node as CommandTree).nodes).length > 0) return
      return findCommand.apply(ctx.config, [convertName(c)])
    }
  }
  ctx.config.findCommand = spacesFindCommand

  // overwrite config.findTopic
  const findTopic = ctx.config.findTopic
  function spacesFindTopic(_: string, __: { must: true }): Config.Topic;
  function spacesFindTopic(
    _: string,
    __: { must: true },
  ): Config.Topic | undefined {
    const [node, c] = tree.findMostProgressiveCmd(RAWARGV)
    if (node) {
      return findTopic.apply(ctx.config, [convertName(c)])
    }
  }
  ctx.config.findTopic = spacesFindTopic

  // overwrite config.runCommand
  ctx.config.runCommand = async (id: string, argv: string[] = []) => {
    // tslint:disable-next-line:no-unused
    const [, name] = tree.findMostProgressiveCmd(RAWARGV)
    // override the id b/c of the closure
    id = name.join(' ')
    argv = convertArgv(name!.join(':'))
    // don't need to pass ID b/c of the closure
    const c = ctx.config.findCommand('')
    if (!c) {
      await ctx.config.runHook('command_not_found', {id})
      throw new CLIError(`command ${id} not found`)
    }
    const command = c.load()
    await ctx.config.runHook('prerun', {Command: command, argv})
    await command.run(argv, ctx.config)
  }
}
