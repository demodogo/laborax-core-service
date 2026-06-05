import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ChileanRut } from '../domain/chilean-rut';

export function IsChileanRut(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isChileanRut',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && ChileanRut.isValid(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Chilean RUT`;
        },
      },
    });
  };
}
