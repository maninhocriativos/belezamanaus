export function ImageMessage() {
  return (
    <div className="flex justify-start">
      <div className="w-48 rounded-lg rounded-tl-sm bg-white p-1 shadow-sm dark:bg-zinc-800">
        <div className="grid aspect-[4/3] place-items-center rounded-md bg-rosebrand-100 text-sm font-medium text-rosebrand-800">
          Preview de imagem
        </div>
        <p className="px-2 py-1 text-[10px] text-zinc-500">13:40</p>
      </div>
    </div>
  );
}
