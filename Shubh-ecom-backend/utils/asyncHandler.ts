module.exports = (fn: (req: any, res: any, next: any) => any) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
