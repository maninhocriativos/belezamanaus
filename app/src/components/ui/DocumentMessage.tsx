import { FileText } from "lucide-react";

export function DocumentMessage() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[72%] items-center gap-3 rounded-lg rounded-tl-sm bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-800">
        <span className="grid size-9 place-items-center rounded-lg bg-rosebrand-50 text-rosebrand-700">
          <FileText size={18} />
        </span>
        <div>
          <p className="font-medium">Documento anexado.pdf</p>
          <p className="text-xs text-zinc-500">PDF - 248 KB - 13:41</p>
        </div>
      </div>
    </div>
  );
}
