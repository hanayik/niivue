#include <stdio.h>
#include <math.h>
#include <float.h>

int nifti_robust_range(float* img, int nvox, float* pct2, float * pct98, float*  mn0, float* mx1,  int ignoreZeroVoxels) {
//https://www.jiscmail.ac.uk/cgi-bin/webadmin?A2=fsl;31f309c1.1307
// robust range is essentially the 2nd and 98th percentiles
// "but ensuring that the majority of the intensity range is captured, even for binary images." 
// fsl uses 1000 bins, also limits for volumes less than 100 voxels taylor.hanayik@ndcn.ox.ac.uk 20190107
//fslstats trick -r
// 0.000000 1129.141968
//niimath >fslstats trick -R
// 0.000000 2734.000000 
	*pct2 = 0.0;
	*pct98 = 1.0;
	*mn0 = 0.0;
	*mx1 = 1.0;
	if (nvox < 1) return 1;
	float mn = INFINITY;
	float mx = -INFINITY;
	size_t nZero = 0;
	size_t nNan = 0;
	for (size_t i = 0; i < nvox; i++ ) {
		if (isnan(img[i])) {
			nNan ++;
			continue;
		}
		if ( img[i] == 0.0 ) {
			nZero++;
			if (ignoreZeroVoxels) continue;
		}
		mn = fmin(img[i],mn);
		mx = fmax(img[i],mx);
	}
	*mn0 = mn;
	*mx1 = mx;
	if ((nZero > 0) && (mn > 0.0) && (!ignoreZeroVoxels)) 
		mn = 0.0;
	if (mn > mx) return 0; //all NaN
	if (mn == mx) {
		*pct2 = mn;
		*pct98 = mx;
	
		return 0;
	}
	if (!ignoreZeroVoxels)
		nZero = 0;
	nZero += nNan;
	size_t n2pct = round((nvox - nZero)* 0.02);
	if ((n2pct < 1) || (mn == mx) || ((nvox -nZero) < 100) ) { //T Hanayik mentioned issue with very small volumes 
		*pct2 = mn;
		*pct98 = mx;
		return 0;
	}
	#define nBins 1001 
	float scl = (nBins-1)/(mx-mn);
	int hist[nBins];
	for (int i = 0; i < nBins; i++ )
		hist[i] = 0;
	if (ignoreZeroVoxels) {
		for (int i = 0; i < nvox; i++ ) {
			if (isnan(img[i])) continue;
			if (img[i] == 0.0) continue;
			hist[(int)round((img[i]-mn)*scl) ]++;
		}	
	} else {
		for (int i = 0; i < nvox; i++ ) {
			if (isnan(img[i])) continue;
			hist[(int)round((img[i]-mn)*scl) ]++;
		}
	}	
	size_t n = 0;
	size_t lo = 0;
	while (n < n2pct) {
		n += hist[lo];
		lo++;
	}
	lo --; //remove final increment
	n = 0;
	int hi = nBins;
	while (n < n2pct) {
		hi--;
		n += hist[hi];
	}
	if (lo == hi) { //MAJORITY are not black or white
		int ok = -1;
		while (ok != 0) {
			if (lo > 0) {
				lo--;
				if (hist[lo] > 0) ok = 0;	
			}
			if ((ok != 0) && (hi < (nBins-1))) {
				hi++;
				if (hist[hi] > 0) ok = 0;	
			}
			if ((lo == 0) && (hi == (nBins-1))) ok = 0;
		} //while not ok
	} //if lo == hi
	*pct2 = (lo)/scl + mn; 
	*pct98 = (hi)/scl + mn;
	return 0;
}

float* robust_range(float* img, int nvox) {
	static float ret[4];
	float pct2, pct98, mn, mx;
	nifti_robust_range(img, nvox, &pct2, &pct98, &mn, &mx, 0);
	ret[0] = pct2;
	ret[1] = pct98;
	ret[2] = mn;
	ret[3] = mx;
	return &ret[0];
}