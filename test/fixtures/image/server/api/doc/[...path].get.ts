// returns the parsed document, so tests can check frontmatter and the AST
export default defineEventHandler((event) => {
  const path = '/' + (event.context.params?.path || '')
  return queryCollection(event, 'content').path(path).first()
})
