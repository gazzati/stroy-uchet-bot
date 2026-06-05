import type { AppDb } from "../db/index.js";
import { ExpenseService } from "./expenses.js";
import { ObjectService } from "./objects.js";
import { UserService } from "./users.js";
import { ReportService } from "../reports/reports.js";

export type Services = {
  users: UserService;
  objects: ObjectService;
  expenses: ExpenseService;
  reports: ReportService;
};

export function createServices(db: AppDb): Services {
  return {
    users: new UserService(db),
    objects: new ObjectService(db),
    expenses: new ExpenseService(db),
    reports: new ReportService(db)
  };
}

