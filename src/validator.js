import * as yup from 'yup';

yup.addMethod(yup.mixed, 'uniqueness', function validate() {
  return this.test({
    name: 'uniqueness',
    test(value) {
      const { feeds } = this.options.context;
      const isUnique = feeds.every(({ url }) => url !== value);
      return isUnique || this.createError();
    },
  });
});

export { yup };

export default (value, schema, state) => {
  try {
    schema.validateSync(value, { abortEarly: false, context: state });
    return null;
  } catch ({ type }) {
    return `form.messages.errors.validation.${type}`;
  }
};
