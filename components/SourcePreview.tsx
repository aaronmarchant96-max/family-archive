import Image from "next/image";

function isPdf(src: string) {
  return src.toLowerCase().endsWith(".pdf");
}

export function SourcePreview({
  src,
  title,
  className = ""
}: {
  src?: string;
  title: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-sm text-slate-500 ${className}`}>
        Private record
      </div>
    );
  }

  if (isPdf(src)) {
    return (
      <div className={`overflow-hidden bg-slate-950 ${className}`}>
        <iframe title={title} src={src} className="h-full w-full border-0 bg-slate-950" />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-slate-950 ${className}`}>
      <Image src={src} alt={title} width={1200} height={1600} className="h-full w-full object-cover" />
    </div>
  );
}
