import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET() {
  const data = dbStore.get();
  const { due, notebook } = dbStore.getReviewQueue(data.user.id);

  return NextResponse.json({
    due_count: due.length,
    notebook_count: notebook.length,
    due_items: due,
    notebook_items: notebook,
  });
}
