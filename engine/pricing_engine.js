// pricing_engine.js

export function calculatePayPerRound({
    rounds,
    greenFee,
    cartFee,
    cartUsageRate
  }) {
  
    const avgRoundCost =
      greenFee + (cartFee * cartUsageRate);
  
    const totalCost =
      rounds * avgRoundCost;
  
    return {
      avgRoundCost,
      totalCost
    };
  }
  
export function calculateMembership({
    membershipCost,
    cartFee,
    cartUsageRate,
    rounds
  }) {
  
    const cartCost =
      rounds * cartFee * cartUsageRate;
  
    const totalCost =
      membershipCost + cartCost;
  
    return {
      cartCost,
      totalCost
    };
  }

  export function compareOptions(inputs) {
  
    const payg =
      calculatePayPerRound(inputs);
  
    const member =
      calculateMembership(inputs);
  
    let recommendation =
      payg.totalCost < member.totalCost
        ? "Pay Per Round"
        : "Membership";
  
    return {
      payg,
      member,
      recommendation
    };
  }
  
  export function findBreakEven(inputs) {

    for (let rounds = 0; rounds <= 200; rounds++) {
  
      const result = compareOptions({
        ...inputs,
        rounds
      });
  
      if (result.recommendation === "Membership") {
        return rounds;
      }
    }
  
    return null;
  }

  export function generateCostCurve(inputs, maxRounds = 200) {

    const results = [];
  
    for (let rounds = 0; rounds <= maxRounds; rounds++) {
  
      const comparison = compareOptions({
        ...inputs,
        rounds
      });
  
      results.push({
        rounds,
        paygCost: comparison.payg.totalCost,
        memberCost: comparison.member.totalCost
      });
    }
  
    return results;
  }

  

  