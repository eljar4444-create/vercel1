export default function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const category = searchParams.category;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">
                {category ? `Results for "${category}"` : "All Services"}
            </h1>
            <p className="text-gray-600">
                We are building the new search experience. Please check back soon!
            </p>
        </div>
    );
}
