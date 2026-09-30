# Federated demonstration

Each state has a separate NPZ dataset. Local gradient descent fits a three-parameter linear ORS model using an intercept, scaled footfall and weekday sine feature. Sixty local steps at learning rate 0.08 produce an update. FedAvg computes the sample-count-weighted mean of the parameter vectors. The global parameters persist and initialize the next round.

Training rows never enter the aggregator. Global model evaluation runs separately inside each state dataset. All workers are logical functions on a single host in this prototype. There is no secure aggregation, differential privacy, isolated execution, or claim that model updates cannot reveal information. The operational model is intentionally separate until federated predictive performance is validated.
