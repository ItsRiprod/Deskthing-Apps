// Any helper files must be in a sub directory or else they will redundantly be included in the /workers folder in the final build (not good)

export const workerHelper = async () => {
  console.log('Worker Helper: Long repeating task is doin its thing');
};