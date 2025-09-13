import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractionResultProps {
  result: string;
  onSave: () => void;
  onClear: () => void;
}

const ExtractionResult: React.FC<ExtractionResultProps> = ({ result, onSave, onClear }) => {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({
      title: "Copied to clipboard",
      description: "The extracted text has been copied.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Text Transaction Posting</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            readOnly
            value={result}
            className="min-h-[250px] bg-gray-50 font-mono text-sm"
            placeholder="Extracted text will appear here..."
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={onClear}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Process More
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard}>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Save as Transaction
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtractionResult;