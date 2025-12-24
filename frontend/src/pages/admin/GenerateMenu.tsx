// pages/admin/GenerateMenu.tsx
import { Button } from '../../components/ui/button'
import { useMessService } from '../../hooks/useMessService'

export default function GenerateMenu() {
  const { generateMenu } = useMessService()

  const handleGenerate = async () => {
    await generateMenu()
    alert('Mess menu generated successfully')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Generate Mess Menu</h1>
      <p className="text-black/60 mb-4">
        Voting has ended. Generate the final mess menu.
      </p>

      <Button onClick={handleGenerate}>
        Generate Menu
      </Button>
    </div>
  )
}
