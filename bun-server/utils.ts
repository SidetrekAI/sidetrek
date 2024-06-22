import { $ } from 'bun'
import * as R from 'ramda'
import type { ServerWebSocket } from 'bun'

// TODO: Handle bun shell error

interface HandleDAGChangeArgs {
  ws: ServerWebSocket<unknown>
  dbtProjectDir: string
}

export const handleDAGChange = async ({ ws, dbtProjectDir }: HandleDAGChangeArgs) => {
  // Run dbt parse for DAG
  try {
    await $`dbt parse`.cwd(dbtProjectDir)
  } catch (error) {
    console.error(error)
  }

  // Convert dbt manifest to RF object
  const dbtManifestJson = await Bun.file(`${dbtProjectDir}/target/manifest.json`).json()
  const rfJson = convertDbtManifestToRF(dbtManifestJson)

  // Send RF object to client
  ws.send(JSON.stringify({ topic: 'dag', data: rfJson }))
}

interface RFDag {
  nodes: RFNode[]
  edges: RFEdge[]
}

interface RFNode {
  id: string
  type?: string
  data?: any
}

interface RFEdge {
  id: string
  source: string
  target: string
}

// Convert dbt manifest to React Flow object
export const convertDbtManifestToRF = (dbtManifestJson: any): RFDag => {
  if (R.isEmpty(dbtManifestJson?.nodes)) return { nodes: [], edges: [] }

  const rfNodes = R.compose(
    R.map((node: any) => {
      return {
        id: node.unique_id,
        data: {
          label: node.name,
          dbt: {
            uniqueId: node.unique_id,
            resourceType: node.resource_type,
            createdAt: node.created_at,
            name: node.name,
            database: node.database,
            schema: node.schema,
            fqn: node.fqn,
            tags: node.tags,
            dependsOn: node.depends_on,
          },
        },
      }
    }),
    R.filter((node: any) => node.resource_type === 'model' || node.resource_type === 'source')
  )([...dbtManifestJson.nodes, ...dbtManifestJson.sources])

  const rfEdges = R.compose(
    R.map((rfNode: RFNode) => {
      const dependsOn = rfNode.data?.dbt?.dependsOn?.nodes || []

      const edges = dependsOn.map((dep: any) => {
        return {
          id: `${dep}-${rfNode.id}`,
          source: dep,
          target: rfNode.id,
        }
      })

      return edges
    })
  )(rfNodes)

  return {
    nodes: rfNodes,
    edges: rfEdges,
  }
}

interface HandleModelChangeArgs {
  ws: ServerWebSocket<unknown>
  dbtProjectDir: string
  filepath: string
}

export const handleModelChange = async ({ ws, dbtProjectDir, filepath }: HandleModelChangeArgs) => {
  const modelName = filepath.includes('/')
    ? filepath.split('/').at(-1)?.split('.sql').at(0)
    : filepath.split('.sql').at(0)
  
  // // Run dbt compile for this model
  // try {
  //   const dbtCompileOut = await $`dbt compile --select ${modelName}`.cwd(dbtProjectDir).text()
  //   const compiledSql = dbtCompileOut.split(`Compiled node '${modelName}' is:`).at(-1)
  // } catch (error) {
  //   console.error(error)
  // }

  // // Convert compiled sql (via sqlglot) to AST so we can add LIMIT clause

  // // Run Trino query to get the model data sample

  // Run `dbt run` for this model
  try {
    await $`dbt run --fail-fast --select ${modelName}`.cwd(dbtProjectDir)
  } catch (error) {
    console.error(error)
  }

  // Send model data sample to client
  // ws.send(JSON.stringify({ topic: 'model', data: queryRes }))
}
