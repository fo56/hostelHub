
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
const localDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function MenuSlotsTable({ menu, swapDish }: any) {
  if (!menu || !menu.meals) return null;
  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-surface-soft">
          <TableRow>
            <TableHead className="w-32 sticky left-0 bg-surface-soft z-10 text-center border-r border-hairline">Day</TableHead>
            {menu.meals.map((meal: any) => (
              <TableHead key={meal.mealName} className="min-w-[140px] text-center">{meal.mealName}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {localDays.map((day, dayIndex) => (
            <TableRow key={day}>
              <TableCell className="font-medium text-ink sticky left-0 bg-surface z-10 border-r border-hairline text-center">
                {day}
              </TableCell>
              {menu.meals.map((meal: any, mealIndex: number) => {
                const slot = meal.slots[dayIndex];
                const fixedNames = slot?.fixedItems?.map((f: any) => f.name) || [];
                return (
                  <TableCell key={meal.mealName} className="align-top">
                    {slot && slot.status === 'SCHEDULED' ? (
                      <div className="flex flex-col gap-1">
                        {slot.rotatingItems?.map((r: any, i: number) => {
                          const name = r.item?.name || r.item?.dishId?.name;
                          if (!name) return null;
                          return (
                            <div key={`rot-${i}`} className="flex items-start justify-between gap-1 group">
                              <span className="text-ink whitespace-normal text-body opacity-100">{name}</span>
                              {menu.status !== 'PUBLISHED' && (
                                <div className="flex transition-opacity shrink-0">
                                  <button 
                                    onClick={() => swapDish(mealIndex, dayIndex, i, 'up')}
                                    disabled={dayIndex === 0}
                                    className="px-1 hover:text-ink text-muted disabled:opacity-0"
                                    title="Move Up"
                                  >↑</button>
                                  <button 
                                    onClick={() => swapDish(mealIndex, dayIndex, i, 'down')}
                                    disabled={dayIndex === 6}
                                    className="px-1 hover:text-ink text-muted disabled:opacity-0"
                                    title="Move Down"
                                  >↓</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {fixedNames.map((name: string, i: number) => (
                          <span key={`fix-${i}`} className="text-body whitespace-normal text-ink opacity-60">{name}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="opacity-30 text-muted">-</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
