import { serverQueryContent } from '#content/server'

// returns the parsed document, so tests can check frontmatter and the AST
export default defineEventHandler((event) => {
  const path = '/' + (event.context.params?.path || '')
  return serverQueryContent(event, path).findOne()
})
