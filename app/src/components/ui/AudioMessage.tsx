import { Mic, Play } from "lucide-react";

export function AudioMessage() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[72%] items-center gap-3 rounded-lg rounded-tl-sm bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-800">
        <button className="grid size-8 place-items-center rounded-full bg-rosebrand-600 text-white" type="button" title="Reproduzir audio">
          <Play size={15} />
        </button>
        <div className="min-w-36 flex-1">
          <div className="h-1.5 rounded-full bg-rosebrand-100">
            <div className="h-1.5 w-1/2 rounded-full bg-rosebrand-500" />
          </div>
          <p className="mt-1 text-xs text-zinc-500">0:18 - transcricao pendente</p>
        </div>
        <Mic className="text-rosebrand-600" size={16} />
      </div>
    </div>
  );
}
