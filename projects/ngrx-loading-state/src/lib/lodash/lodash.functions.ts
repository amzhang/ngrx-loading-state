// This file is in the "lr-lodash" directory so that we can use the barrel file
// to create the lodash namespace. If we put this into the "functions" folder, then
// other functions in there that uses lodash won't have the lodash namespace.
// The internet says this style of import improves bundle size. At least we only have to
// do this in a single place here.
export { isArray, isEqual, isPlainObject, pick } from 'lodash';
