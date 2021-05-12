import * as yup from 'yup';

export default ({ feeds }) => {
  const schema = yup.string().url().test(
    'uniqueness',
    'this must be a unique URL',
    (value, context) => {
      const isUnique = feeds.every(({ url }) => url !== value);
      return isUnique || context.createError();
    },
  );

  return (value) => {
    try {
      schema.validateSync(value, { abortEarly: false });
      return null;
    } catch ({ inner: [{ type }] }) {
      return `form.messages.errors.validation.${type}`;
    }
  };
};
