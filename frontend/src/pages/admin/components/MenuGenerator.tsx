
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'

export function MenuGenerator({ totalVoters, totalStudents, requestsNewMenu, generating, generateMenu }: any) {
  return (
    <Card className="flex flex-col animate-fade-in stagger-2">
      <CardContent className="p-6 flex flex-col items-center justify-center flex-1 space-y-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-ink">
            {totalVoters} / {totalStudents}
          </p>
          <p className="text-body-sm text-muted">Students Voted</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-semantic-warning">
            {requestsNewMenu}
          </p>
          <p className="text-body-sm text-muted">Requesting New Menu</p>
        </div>
        <Button 
          variant="primary" 
          onClick={generateMenu} 
          disabled={generating} 
          className="w-full mt-4"
        >
          {generating ? 'Generating Smart Menu...' : 'Generate AI Menu'}
        </Button>
      </CardContent>
    </Card>
  )
}
