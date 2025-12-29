import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";

interface Course {
	id: number;
	name: string;
	credits: number;
	grade: number; // 4.0 scale
}

export function GPACalculator() {
	const [courses, setCourses] = useState<Course[]>([
		{ id: 1, name: "Course 1", credits: 3, grade: 4.0 },
		{ id: 2, name: "Course 2", credits: 4, grade: 3.7 },
	]);

	const addCourse = () => {
		setCourses([...courses, { id: Date.now(), name: "New Course", credits: 3, grade: 3.0 }]);
	};

	const removeCourse = (id: number) => {
		setCourses(courses.filter(c => c.id !== id));
	};

	const clearAll = () => {
		if (confirm("Clear all courses?")) {
			setCourses([]);
		}
	};

	const updateCourse = (id: number, field: keyof Course, value: string | number) => {
		setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
	};

	const calculateGPA = () => {
		const totalPoints = courses.reduce((acc, curr) => acc + (curr.credits * curr.grade), 0);
		const totalCredits = courses.reduce((acc, curr) => acc + curr.credits, 0);
		return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
	};

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<Calculator className="h-4 w-4 text-primary" />
						GPA Calculator
					</div>
					<span className="text-2xl font-bold text-primary">{calculateGPA()}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex gap-2">
					<Button variant="outline" size="sm" className="flex-1 text-xs" onClick={addCourse}>
						<Plus className="h-3 w-3 mr-1" /> Add Course
					</Button>
					<Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearAll}>
						<RotateCcw className="h-3 w-3 mr-1" /> Clear
					</Button>
				</div>
				<div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
					{courses.map((course) => (
						<div key={course.id} className="flex gap-2 items-center">
							<Input
								className="h-8 text-xs flex-[2]"
								value={course.name}
								onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
							/>
							<Input
								className="h-8 text-xs flex-[1]"
								type="number"
								value={course.credits}
								onChange={(e) => updateCourse(course.id, 'credits', Number(e.target.value))}
							/>
							<Input
								className="h-8 text-xs flex-[1]"
								type="number"
								step="0.1"
								max="4.0"
								value={course.grade}
								onChange={(e) => updateCourse(course.id, 'grade', Number(e.target.value))}
							/>
							<Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeCourse(course.id)}>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
