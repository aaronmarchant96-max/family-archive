import documentsData from "../../data/documents.json";
import { DocumentsBrowser } from "../../components/DocumentsBrowser";
import type { DocumentCardProps } from "../../components/DocumentCard";

const documents = documentsData as DocumentCardProps[];

export default function DocumentsPage() {
  return (
    <DocumentsBrowser documents={documents} />
  );
}
