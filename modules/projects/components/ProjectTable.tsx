'use client';

import { Project } from '@prisma/client';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

const columnHelper = createColumnHelper<Project>();

const columns = [
  columnHelper.accessor('title', {
    cell: (info) => info.getValue(),
    header: () => <span>Title</span>,
    enableResizing: true,
  }),
  columnHelper.accessor('description', {
    cell: (info) => info.getValue(),
    header: () => <span>Description</span>,
    enableResizing: true,
  }),
];

export default function ProjectTable({ projects }: { projects: Project[] }) {
  const table = useReactTable({
    columns,
    data: projects,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table
      className="w-full border"
      {...{
        style: {
          width: table.getCenterTotalSize(),
        },
      }}
    >
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                colSpan={header.colSpan}
                style={{
                  width: header.getSize(),
                }}
                className="relative border bg-zinc-50 px-4 py-2 text-left"
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                <div
                  {...{
                    onMouseDown: header.getResizeHandler(),
                    onTouchStart: header.getResizeHandler(),
                    className: `absolute right-0 top-0 h-full w-1 bg-blue-500/10 cursor-col-resize ${
                      header.column.getIsResizing() ? 'isResizing' : ''
                    }`,
                    style: {
                      transform: header.column.getIsResizing()
                        ? `translateX(${table.getState().columnSizingInfo.deltaOffset}px)`
                        : '',
                    },
                  }}
                />
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                style={{
                  width: cell.column.getSize(),
                }}
                className="border px-4 py-2 text-left"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
