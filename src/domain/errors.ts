export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

export class AccessDeniedError extends AppError {
  constructor(message = "Недостаточно прав") {
    super(message, "access_denied");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Не найдено") {
    super(message, "not_found");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "validation_error");
  }
}

