import documentsData from "../../data/documents.json";
import { DocumentCard, type DocumentCardProps } from "../../components/DocumentCard";

const documents = documentsData as DocumentCardProps[];

export default function DocumentsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="archive-panel">
        <div className="archive-kicker">Documents</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Document previews</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Metadata-only records for scans, certificates, and letters. Files stay private until you choose to expose
          them.
        </p>
      </div>
      <div className="archive-grid">
        {documents.length ? (
          documents.map((document) => <DocumentCard key={document.id} {...document} />)
        ) : (
          <div className="archive-empty">
            No document records loaded yet. Add a filename, date, people, and what the record proves to
            `data/documents.json`.
          </div>
        )}
      </div>
    </section>
  );
}
