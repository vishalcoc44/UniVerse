
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useUserUniversity() {
	const [universityId, setUniversityId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		const fetchUni = async () => {
			setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				setUserId(user.id);
				const { data } = await supabase
					.from('Profile')
					.select('universityId')
					.eq('id', user.id)
					.single();

				if (data) {
					setUniversityId(data.universityId);
				}
			}
			setLoading(false);
		};
		fetchUni();
	}, []);

	return { universityId, loading, userId };
}
