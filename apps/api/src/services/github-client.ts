export async function postCommentToPR(
  installationId: number,
  repoFullName: string,
  prNumber: number,
  comment: string
) {
  // GitHub API integration will go here
  console.log(`Posting comment to ${repoFullName}#${prNumber}`)
}