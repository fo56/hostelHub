import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Pagination } from "../../components/ui/pagination";
import { Users, FileText, Database, Activity, Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";


export default function StudentStats() {
  const { fetchApi } = useApi();
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Reviews Modal State
  const [reviewsModal, setReviewsModal] = useState<{
    isOpen: boolean;
    dish: any;
    reviews: any[];
    loading: boolean;
  } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi("/student/stats");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDishes =
    stats?.dishCatalog?.filter(
      (dish: any) =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.category.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDishes = [...filteredDishes].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let valA = a[key];
    let valB = b[key];

    if (valA == null) valA = '';
    if (valB == null) valB = '';

    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const openReviewsModal = async (dish: any) => {
    setReviewsModal({ isOpen: true, dish, reviews: [], loading: true });
    try {
      const data = await fetchApi(`/reviews/dish/${dish.id || dish._id}`);
      setReviewsModal({ isOpen: true, dish, reviews: data, loading: false });
    } catch (err: any) {
      setReviewsModal({ isOpen: true, dish, reviews: [], loading: false });
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <section className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-card-title md:text-headline tracking-tight text-ink leading-tight">
            Hostel Statistics & Transparency
          </h1>
          <p className="text-body text-muted mt-1">
            Real-time data on student voting, active rules, and the complete
            dish catalog.
          </p>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          <Card className="h-32 bg-elevated border-hairline"></Card>
          <Card className="h-32 bg-elevated border-hairline"></Card>
        </div>
      ) : stats ? (
        <div className="space-y-6 animate-fade-in stagger-1">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-card-title flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted" />
                  Voting Participation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-hairline pb-2">
                    <span className="text-body text-muted">Total Students</span>
                    <span className="text-xl font-bold text-ink">{stats.totalStudents}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-body text-muted flex items-center gap-2"><Activity className="w-4 h-4" /> Active Voters</span>
                    <span className="text-xl font-bold text-ink">{stats.activeVotingStudents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col max-h-64">
              <CardHeader className="pb-3 border-b border-hairline sticky top-0 bg-surface z-10">
                <CardTitle className="text-card-title flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted" />
                  Active Rules
                  <Badge variant="secondary" className="ml-auto">{stats.constraints?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto pt-3 flex-1 no-scrollbar">
                {stats.constraints?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {stats.constraints.map((c: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-start border-b border-hairline last:border-0 pb-2 last:pb-0">
                        <span className="text-body-sm text-ink leading-tight">{c.sourcePhrase}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted text-sm">No active rules.</div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Full Dish Catalog & Votes */}
          <Card className="animate-fade-in stagger-4">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-card-title">
                  <Database className="w-5 h-5 text-muted" />
                  Full Dish Catalog & Votes
                </CardTitle>
                <p className="text-body-sm text-muted mt-1">
                  See the raw vote counts for every dish in the database.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  placeholder="Search dishes..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              {sortedDishes.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(sortedDishes.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  totalItems={sortedDishes.length}
                  itemsPerPage={itemsPerPage}
                />
              )}
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader className="bg-surface-soft">
                    <TableRow>
                      <TableHead className="text-center sticky left-0 bg-surface-soft z-10 cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('name')}>
                        <div className="flex items-center justify-center gap-1">
                          Dish Name <span className="w-3 inline-block text-center">{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('mealType')}>
                        <div className="flex items-center justify-center gap-1">
                          Meal Type <span className="w-3 inline-block text-center">{sortConfig?.key === 'mealType' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('category')}>
                        <div className="flex items-center justify-center gap-1">
                          Category <span className="w-3 inline-block text-center">{sortConfig?.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('type')}>
                        <div className="flex items-center justify-center gap-1">
                          Type <span className="w-3 inline-block text-center">{sortConfig?.key === 'type' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('avgRating')}>
                        <div className="flex items-center justify-center gap-1">
                          Rating <span className="w-3 inline-block text-center">{sortConfig?.key === 'avgRating' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('priceScore')}>
                        <div className="flex items-center justify-center gap-1">
                          Price <span className="w-3 inline-block text-center">{sortConfig?.key === 'priceScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('healthScore')}>
                        <div className="flex items-center justify-center gap-1">
                          Health <span className="w-3 inline-block text-center">{sortConfig?.key === 'healthScore' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Tags</TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('status')}>
                        <div className="flex items-center justify-center gap-1">
                          Status <span className="w-3 inline-block text-center">{sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer hover:bg-hairline/20 transition-colors" onClick={() => handleSort('totalVotes')}>
                        <div className="flex items-center justify-center gap-1">
                          Votes <span className="w-3 inline-block text-center">{sortConfig?.key === 'totalVotes' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Reviews</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDishes.length > 0 ? (
                      (() => {
                        const paginatedDishes = sortedDishes.slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
                        );

                        return (
                          <>
                            {paginatedDishes.map((dish: any) => (
                              <TableRow
                                key={dish.id}
                                className="transition-colors hover:bg-surface-soft cursor-pointer"
                                onClick={() => openReviewsModal(dish)}
                              >
                                <TableCell className="font-medium text-ink text-center whitespace-nowrap sticky left-0 z-10 bg-canvas group-hover:bg-surface-soft shadow-[1px_0_0_0_var(--color-hairline)]">
                                  {dish.name}
                                </TableCell>
                                <TableCell className="text-muted text-center whitespace-nowrap">
                                  {dish.mealType}
                                </TableCell>
                                <TableCell className="text-muted text-center">
                                  {dish.category || "-"}
                                </TableCell>
                                <TableCell className="text-muted text-center">
                                  <span
                                    className={`inline-flex px-2 py-1 rounded text-caption uppercase font-bold tracking-wider border ${dish.type === "FIXED" ? "bg-ink border-ink text-canvas" : "bg-transparent border-hairline text-muted"}`}
                                  >
                                    {dish.type || "ROTATING"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center font-mono text-data text-semantic-warning">
                                  {dish.avgRating !== "-" ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <span>★</span>
                                      <span>{dish.avgRating}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted">
                                      No ratings
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {dish.priceScore !== "-" ? (
                                    <div
                                      className="flex items-center justify-center gap-2"
                                      title={`Price: ${dish.priceScore}/5`}
                                    >
                                      <div className="w-12 h-1.5 bg-hairline rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-ink"
                                          style={{
                                            width: `${(Number(dish.priceScore) / 5) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {dish.healthScore !== "-" ? (
                                    <div
                                      className="flex items-center justify-center gap-2"
                                      title={`Health: ${dish.healthScore}/5`}
                                    >
                                      <div className="w-12 h-1.5 bg-hairline rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-ink"
                                          style={{
                                            width: `${(Number(dish.healthScore) / 5) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}
                                </TableCell>
                                <TableCell
                                  className="text-center truncate max-w-[150px]"
                                  title={dish.tags?.join(", ")}
                                >
                                  {dish.tags?.join(", ") || "—"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={
                                      dish.status === "ACTIVE"
                                        ? "success"
                                        : "outline"
                                    }
                                  >
                                    {dish.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  <span
                                    className={
                                      dish.totalVotes > 0
                                        ? "text-ink"
                                        : "text-muted"
                                    }
                                  >
                                    {dish.totalVotes || 0}
                                  </span>
                                  <span className="text-muted text-body-sm font-normal">
                                    {" "}
                                    / {stats.activeVotingStudents}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center text-muted">
                                  {dish.numRatings || 0}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        );
                      })()
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="h-24 text-center text-muted"
                        >
                          No dishes found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* DISH REVIEWS MODAL */}
      <Modal
        isOpen={reviewsModal?.isOpen || false}
        onClose={() => setReviewsModal(null)}
        title={`Reviews for ${reviewsModal?.dish?.name || "Dish"}`}
      >
        <div className="p-4">
          {reviewsModal?.loading ? (
            <div className="text-center text-muted text-body py-8">
              Loading reviews...
            </div>
          ) : reviewsModal?.reviews.length === 0 ? (
            <div className="text-center text-muted text-body py-8">
              No reviews yet for this dish.
            </div>
          ) : (
            <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
              {reviewsModal?.reviews.map((r: any) => (
                <div
                  key={r._id}
                  className="p-3 bg-surface border border-hairline rounded-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-ink">
                      {r.studentId?.name ||
                        r.studentId?.username ||
                        "Unknown Student"}
                    </span>
                    <span className="text-sm font-mono text-semantic-warning bg-semantic-warning/10 px-2 py-1 rounded font-bold">
                      ★ {r.rating}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-body-sm text-muted">{r.comment}</p>
                  )}
                  <div className="text-[10px] text-muted mt-2">
                    Served on {new Date(r.servedOn).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
