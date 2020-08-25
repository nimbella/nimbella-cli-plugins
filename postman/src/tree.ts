import {asTree} from 'treeify'

class Tree {
  nodes: { [key: string]: Tree } = {};

  insert(child: string, value: Tree = new Tree()): Tree {
    this.nodes[child] = value
    return this
  }

  childSearch(key: string): Tree | undefined {
    const k = Object.keys(this.nodes).find(k => k === key)
    return k ? this.nodes[k] : undefined
  }

  findOrInsert(child: string, value: Tree = new Tree()): Tree {
    const c = this.childSearch(child)
    if (c) return c
    this.insert(child, value)
    return this.childSearch(child) as Tree
  }

  // tslint:disable-next-line:no-console
  display(logger: any = console.log) {
    const addNodes = function (nodes: any) {
      const tree: { [key: string]: any } = {}
      for (const p of Object.keys(nodes)) {
        tree[p] = addNodes(nodes[p].nodes)
      }
      return tree
    }

    const tree = addNodes(this.nodes)
    logger(asTree(tree, false, false))
  }
}

export default class CommandTree extends Tree {
  findMostProgressiveCmd(id: string[]): [Tree | undefined, string[]] {
    let cur
    let next
    for (let i = 0; i < id.length; i++) {
      next = (next ? next : this).nodes[id[i]]
      if (next) cur = next
      else return [cur, i ? id.slice(0, i) : []]
    }
    return [cur, id]
  }
}
