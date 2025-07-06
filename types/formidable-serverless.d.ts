declare module 'formidable-serverless' {
  import { IncomingForm, File, Fields, Files } from 'formidable';
  const formidable: typeof IncomingForm;
  export default formidable;
}
