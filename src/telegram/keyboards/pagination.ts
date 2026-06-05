import { InlineKeyboard } from "grammy";
import { CB, cb } from "../callbacks/actions.js";

export const PAGE_SIZE = 8;

export type Paged<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

export function paginate<T>(all: T[], page: number, size = PAGE_SIZE): Paged<T> {
  const totalPages = Math.max(1, Math.ceil(all.length / size));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * size;
  return { items: all.slice(start, start + size), page: safePage, totalPages };
}

/**
 * Appends a "◀ N/M ▶" navigation row to the keyboard when there is more than one page.
 * `listCode` identifies which list to repaginate; the page index is encoded in callback_data.
 */
export function appendPagination(keyboard: InlineKeyboard, listCode: string, page: number, totalPages: number): void {
  if (totalPages <= 1) {
    return;
  }

  keyboard.row();
  if (page > 0) {
    keyboard.text("◀️", cb(CB.PAGE, listCode, String(page - 1)));
  }
  keyboard.text(`${page + 1}/${totalPages}`, cb(CB.NOOP));
  if (page < totalPages - 1) {
    keyboard.text("▶️", cb(CB.PAGE, listCode, String(page + 1)));
  }
}
