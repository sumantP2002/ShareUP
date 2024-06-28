const asyncHandler = (requestHandler) => {
    Promise.then(requestHandler(req, res, next)).catch((err)=>next(err))
}

export {asyncHandler}