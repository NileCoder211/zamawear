
import joi from "joi";

// Password rule:
// - 8–64 characters
// - at least one letter
// - at least one digit
// - special characters are allowed
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{8,64}$/;

export const signupSchema = joi.object({
  email: joi.string()
    .min(6)
    .max(60)
    .required()
    .email(),

  password: joi.string()
    .required()
    .pattern(passwordPattern),
});

export const signinSchema = joi.object({
  email: joi.string()
    .min(6)
    .max(60)
    .required()
    .email(),

  password: joi.string()
    .required()
    .pattern(passwordPattern),
});

export const acceptCodeSchema = joi.object({
  email: joi.string()
    .min(6)
    .max(60)
    .required()
    .email(),

  providedCode: joi.string()
    .pattern(/^\d{1,6}$/)
    .required(),
});

export const changePasswordSchema = joi.object({
  oldPassword: joi.string()
    .required()
    .pattern(passwordPattern),

  newPassword: joi.string()
    .required()
    .pattern(passwordPattern)
    .invalid(joi.ref("oldPassword"))
    .messages({
      "any.invalid": "New password must be different from old password",
    }),
});

export const acceptForgotPasswordCodeSchema = joi.object({
  email: joi.string()
    .min(6)
    .max(60)
    .required()
    .email(),

  providedCode: joi.string()
    .pattern(/^\d{1,6}$/)
    .required(),

  newPassword: joi.string()
    .required()
    .pattern(passwordPattern),
});

export const createPostSchema = joi.object({
  title: joi.string()
    .min(6)
    .max(60)
    .required(),

  description: joi.string()
    .min(6)
    .max(600)
    .required(),

  userId: joi.string()
    .required(),
});

